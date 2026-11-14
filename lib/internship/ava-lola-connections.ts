import { supabaseAdmin } from "@/lib/supabase/admin";
import { getInternOnboarding } from "@/lib/internship/queries";
import { internOnboardingComplete, internOnboardingStatusLabel } from "@/lib/internship/onboarding";
import { GROWTH_HIRE_ROLE } from "@/lib/admin/growth/hire";

export type ConnectionCheck = {
  label: string;
  status: "ready" | "action" | "blocked" | "external";
  detail: string;
  href?: string;
};
export type AccountConnection = {
  kind: "ava" | "lola";
  title: string;
  userId: string | null;
  checks: ConnectionCheck[];
};

type AuthAccount = { id: string; email?: string | null; email_confirmed_at?: string | null; last_sign_in_at?: string | null };

async function uniqueAuthByEmails(emails: string[]): Promise<{ account: AuthAccount | null; problem: string }> {
  const normalized = [...new Set(emails.map((e) => e.trim().toLowerCase()).filter((e) => e.includes("@")))];
  if (!normalized.length) return { account: null, problem: "No assigned login email." };
  const ids = new Set<string>();
  for (const email of normalized) {
    const { data, error } = await supabaseAdmin.from("profiles").select("id,email").ilike("email", email).limit(3);
    if (error) return { account: null, problem: "Unable to read account profiles." };
    (data || []).forEach((p) => { if (String(p.email || "").trim().toLowerCase() === email) ids.add(String(p.id)); });
  }
  // Existing users may not have created a profiles row yet.
  if (ids.size === 0) {
    for (let page = 1; page <= 5; page++) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) return { account: null, problem: "Unable to read authentication records." };
      for (const user of data.users || []) {
        if (normalized.includes(String(user.email || "").trim().toLowerCase())) ids.add(user.id);
      }
      if ((data.users || []).length < 200) break;
    }
  }
  if (ids.size !== 1) return { account: null, problem: ids.size ? "Multiple login identities match; manual review required." : "No matching SitGuru login yet." };
  const id = [...ids][0];
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);
  const auth = data?.user;
  if (error || !auth || !normalized.includes(String(auth.email || "").trim().toLowerCase())) {
    return { account: null, problem: "The profile does not match a verified SitGuru auth identity." };
  }
  return { account: auth, problem: auth.email_confirmed_at ? "" : "Email verification is incomplete." };
}

export async function getAvaLolaConnections(): Promise<AccountConnection[]> {
  const [managerAccess, lolaRows, socialConnections] = await Promise.all([
    supabaseAdmin.from("admin_user_access")
      .select("id,user_id,email,role_key,is_active")
      .ilike("email", "ava@sitguru.com").eq("role_key", GROWTH_HIRE_ROLE).limit(4),
    supabaseAdmin.from("internship_interns")
      .select("id,user_id,full_name,email,work_email,student_email,status,portal_enabled,manager_user_id,approval_status")
      .ilike("full_name", "%Lola%Uhl%").limit(4),
    supabaseAdmin.from("growth_social_connections").select("platform,status,last_synced_at").limit(15),
  ]);
  const accessRows = managerAccess.data || [];
  const internRows = lolaRows.data || [];
  const avaLogin = await uniqueAuthByEmails(["ava@sitguru.com"]);
  const avaId = avaLogin.account?.id || null;
  const activeAccess = accessRows.find((row) => row.is_active === true) || null;

  const [avaRoles, eligibility, activeEngagement, lolaLogin] = await Promise.all([
    avaId ? supabaseAdmin.from("user_roles").select("role").eq("user_id", avaId) : Promise.resolve({data: [] as {role:string}[]}),
    avaId ? supabaseAdmin.from("internship_staff_eligibility").select("can_manage_interns").eq("user_id", avaId).maybeSingle() : Promise.resolve({data:null as {can_manage_interns:boolean}|null}),
    avaId ? supabaseAdmin.from("staff_engagements").select("id,status").eq("user_id", avaId).eq("status","active").limit(1) : Promise.resolve({data: [] as {id:string;status:string}[]}),
    internRows.length === 1 ? uniqueAuthByEmails([internRows[0].work_email || "",internRows[0].email || "",internRows[0].student_email || ""]) : Promise.resolve({account:null,problem:internRows.length > 1 ? "Multiple Lola internship records; manual review required." : "No Lola internship record found."}),
  ]);
  const lola = internRows.length === 1 ? internRows[0] : null;
  const lolaId = lolaLogin.account?.id || null;
  const lolaValid = Boolean(lolaId && lolaLogin.account?.email_confirmed_at);
  const lolaLinked = Boolean(lola && lolaId && lola.user_id === lolaId);
  const avaValid = Boolean(avaId && avaLogin.account?.email_confirmed_at);
  const verifiedManager = Boolean(activeAccess && activeAccess.user_id === avaId && avaValid);
  const avaRoleOk = (avaRoles.data || []).some((row) => row.role === GROWTH_HIRE_ROLE);
  const [lolaRoles, lolaOnboarding, lolaTasks, lolaReviews] = await Promise.all([
    lolaId ? supabaseAdmin.from("user_roles").select("role").eq("user_id",lolaId) : Promise.resolve({data:[] as {role:string}[]}),
    lola ? getInternOnboarding(lola.id) : Promise.resolve(null),
    lola ? supabaseAdmin.from("internship_tasks").select("id", { count:"exact",head:true }).eq("intern_id",lola.id) : Promise.resolve({count:0}),
    lola ? supabaseAdmin.from("internship_weekly_reviews").select("id", { count:"exact",head:true }).eq("intern_id",lola.id) : Promise.resolve({count:0}),
  ]);
  const lolaRoleSet = new Set((lolaRoles.data || []).map((row) => String(row.role).toLowerCase()));
  const checks: AccountConnection[] = [
    {
      kind:"ava", title:"Ava Venezia — Growth Manager", userId:avaId,
      checks:[
        { label:"Verified account", status:avaValid?"ready":"blocked", detail:avaValid?"Account and verified email matched.":avaLogin.problem || "Verify the assigned email." },
        { label:"Manager Portal role", status:verifiedManager && avaRoleOk?"ready":avaValid && activeAccess?.is_active?"action":"blocked", detail:verifiedManager && avaRoleOk?"Manager role and HQ access match the same auth identity.":activeAccess?.is_active?"Approved Growth Manager access needs account reconciliation.":"Active Growth Manager access is not recorded.",href:"/admin/hr/team-access" },
        { label:"Intern management", status:eligibility.data?.can_manage_interns?"ready":verifiedManager?"action":"blocked",detail:eligibility.data?.can_manage_interns?"Assigned intern reviews can be managed.":"Manager eligibility must be enabled.",href:avaId?`/admin/hr/staff/${encodeURIComponent(avaId)}/access`:undefined },
        { label:"Staff time & payments", status:(activeEngagement.data || []).length?"ready":"action",detail:(activeEngagement.data || []).length?"Active staff engagement found.":"Confirm staff engagement, compensation and payout setup.",href:"/admin/hr/people" },
        { label:"Lola assigned to Ava",status:avaId && lola?.manager_user_id===avaId?"ready":verifiedManager && lola?.manager_user_id==null?"action":"blocked",detail:lola?.manager_user_id===avaId?"Lola's internship manager points to Ava's auth account.":lola?.manager_user_id?"A different manager is assigned. Do not override automatically.":"Manager assignment is missing.",href:lola?`/admin/internship/interns/${lola.id}`:undefined },
        { label:"Social media API connections",status:(socialConnections.data || []).some((r) => r.status==="connected")?"ready":"external",detail:(socialConnections.data || []).some((r)=>r.status==="connected")?"At least one provider reports connected; verify each platform in Growth Insights.":"Meta, TikTok, YouTube and X permissions/OAuth require external account authorization.",href:"/manager/insights" },
      ],
    },
    {
      kind:"lola",title:"Lola Uhl — Spring 2027 Intern",userId:lolaId,
      checks:[
        { label:"Internship record",status:lola?"ready":"blocked",detail:lola?"Existing internship record located.":lolaLogin.problem,href:lola?`/admin/internship/interns/${lola.id}`:undefined },
        { label:"Verified account",status:lolaValid?"ready":"blocked",detail:lolaValid?"Account email verified and matched to internship emails.":lolaLogin.problem },
        { label:"Linked intern login",status:lolaLinked?"ready":lolaValid && !lola?.user_id?"action":"blocked",detail:lolaLinked?"The intern record points to Lola's login.":lola?.user_id?"A different login is linked; manual verification is required.":"Login must be linked to the existing intern record." },
        { label:"Intern Portal enabled",status:lola?.portal_enabled && ["accepted","approved","active","completed"].includes(lola.status)?"ready":"action",detail:lola?.portal_enabled?"Portal may require an approved/accepted internship status.":"Portal is disabled; confirm academic/employer approval first.",href:lola?`/admin/internship/interns/${lola.id}`:undefined },
        { label:"Intern role",status:lolaRoleSet.has("intern")?"ready":lolaValid && lola?"action":"blocked",detail:lolaRoleSet.has("intern")?"Intern role exists in Lola's role switcher.":"The intern role should be added without replacing Pet Parent/Guru/Ambassador roles." },
        { label:"Signed onboarding",status:internOnboardingComplete(lolaOnboarding)?"ready":"action",detail:internOnboardingStatusLabel(lolaOnboarding),href:"/intern/onboarding" },
        { label:"Assigned work & check-ins",status:(lolaTasks.count||0)>0?"ready":"action",detail:`${lolaTasks.count||0} assignments, ${lolaReviews.count||0} weekly reviews in SitGuru.`,href:lola?`/admin/internship/interns/${lola.id}#work`:undefined },
        { label:"Guru & Ambassador roles",status:lolaRoleSet.has("guru") && lolaRoleSet.has("ambassador")?"ready":"action",detail:`Guru: ${lolaRoleSet.has("guru")?"role present":"not verified"}; Ambassador: ${lolaRoleSet.has("ambassador")?"role present":"not verified"}. Registration and eligibility must be completed in those respective portals.`,href:"/admin/users" },
      ],
    },
  ];
  return checks;
}

/**
 * Idempotent, bounded reconciliation of previously approved team relationships.
 * Never overrides a different assigned manager, waives onboarding, or changes
 * marketplace roles. Called only after a Super Admin presses the explicit button.
 */
export async function reconcileAvaLolaAccounts(actor: { id:string;email:string }) {
  const statuses = await getAvaLolaConnections();
  const ava = statuses[0], lola = statuses[1];
  const avaId = ava.userId, lolaId = lola.userId;
  const now = new Date().toISOString();
  const changes: string[] = [];
  if (avaId) {
    const { data: auth } = await supabaseAdmin.auth.admin.getUserById(avaId);
    const valid = auth?.user?.email_confirmed_at && String(auth.user.email||"").toLowerCase() === "ava@sitguru.com";
    const { data: access } = await supabaseAdmin.from("admin_user_access").select("id,user_id,is_active")
      .eq("role_key",GROWTH_HIRE_ROLE).ilike("email","ava@sitguru.com").eq("is_active",true).limit(2);
    if (valid && access?.length===1 && (!access[0].user_id || access[0].user_id===avaId)) {
      if (!access[0].user_id) {
        const { error } = await supabaseAdmin.from("admin_user_access").update({user_id:avaId,updated_at:now}).eq("id",access[0].id).is("user_id",null);
        if (error) throw Error("Ava access link: "+error.message);
        changes.push("Linked active Growth Manager access to Ava's verified login");
      }
      const { error: roleError } = await supabaseAdmin.from("user_roles").upsert({user_id:avaId,role:GROWTH_HIRE_ROLE,updated_at:now},{onConflict:"user_id,role"});
      if (roleError) throw Error("Ava manager role: "+roleError.message);
      changes.push("Verified Ava's Growth Manager role");
      const { data: current } = await supabaseAdmin.from("internship_staff_eligibility").select("can_manage_interns,can_supervise_interns,job_title").eq("user_id",avaId).maybeSingle();
      if (current && !current.can_manage_interns) {
        const { error } = await supabaseAdmin.from("internship_staff_eligibility").update({can_manage_interns:true,updated_by:actor.id,updated_at:now}).eq("user_id",avaId);
        if (error) throw Error("Ava manager eligibility: "+error.message);
        changes.push("Enabled Ava's assigned intern management eligibility");
      }
    }
  }
  const { data: interns } = await supabaseAdmin.from("internship_interns").select("id,user_id,full_name,email,student_email,work_email,status,portal_enabled,manager_user_id")
    .ilike("full_name","%Lola%Uhl%").limit(3);
  const intern=interns?.length===1?interns[0]:null;
  const approved=intern && ["accepted","approved","active"].includes(intern.status);
  if (lolaId && intern && approved) {
    const { data: auth }=await supabaseAdmin.auth.admin.getUserById(lolaId);
    const matched=auth?.user?.email_confirmed_at &&
      [intern.email,intern.student_email,intern.work_email].some((e)=>String(e||"").toLowerCase()===String(auth.user?.email||"").toLowerCase());
    if (matched && (!intern.user_id || intern.user_id===lolaId)) {
      if (!intern.user_id) {
        const { error }=await supabaseAdmin.from("internship_interns").update({user_id:lolaId,updated_at:now}).eq("id",intern.id).is("user_id",null);
        if(error)throw Error("Lola login link: "+error.message);
        changes.push("Linked approved Lola internship to verified login");
      }
      const { error: roleError }=await supabaseAdmin.from("user_roles").upsert({user_id:lolaId,role:"intern",updated_at:now},{onConflict:"user_id,role"});
      if(roleError)throw Error("Lola intern role: "+roleError.message);
      changes.push("Verified Lola's intern role without changing marketplace roles");
      if(avaId && !intern.manager_user_id && ava.checks[1].status!=="blocked") {
        const { error }=await supabaseAdmin.from("internship_interns").update({manager_user_id:avaId,updated_at:now}).eq("id",intern.id).is("manager_user_id",null);
        if(error)throw Error("Lola manager link: "+error.message);
        changes.push("Assigned Lola to her verified Growth Manager Ava");
      }
    }
  }
  if(changes.length) {
    await supabaseAdmin.from("admin_audit_logs").insert({
      actor_id:actor.id,actor_email:actor.email,action:"reconciled Ava and Lola connections",
      area:"internship",target_type:"team_connections",target_id:actor.id,metadata:{changes},
    });
  }
  return changes;
}
