import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  headerModeForSharedMessages,
  messageContinuationHref,
  messageConversationHref,
  messageInboxHref,
  messageSupportHref,
  resolveAuthorizedMessagePortal,
} from "./portal-context";

const guruOnly = ["guru"] as const;
const parentOnly = ["parent"] as const;
const both = ["parent", "guru"] as const;

describe("shared message portal", () => {
  it("keeps a Guru-only account on Guru navigation", () => {
    assert.equal(
      headerModeForSharedMessages({
        pathname: "/messages",
        isLoggedIn: true,
        storedRole: "guru",
        requestedRole: "guru",
        returnTo: "/guru/dashboard",
        authorizedRoles: guruOnly,
      }),
      "guru",
    );
  });

  it("keeps a Pet Parent-only account on Pet Parent navigation", () => {
    assert.equal(
      headerModeForSharedMessages({
        pathname: "/messages",
        isLoggedIn: true,
        storedRole: "customer",
        requestedRole: "customer",
        returnTo: "/customer/dashboard",
        authorizedRoles: parentOnly,
      }),
      "customer",
    );
  });

  it("keeps a multi-role account in Guru context when Guru messages are opened", () => {
    assert.equal(
      resolveAuthorizedMessagePortal({
        requestedRole: "guru",
        returnTo: "/guru/dashboard",
        authorizedRoles: both,
        fallbackRole: "customer",
      }),
      "guru",
    );
  });

  it("lets a multi-role account open Pet Parent messages on purpose", () => {
    assert.equal(
      resolveAuthorizedMessagePortal({
        requestedRole: "customer",
        returnTo: "/customer/dashboard",
        authorizedRoles: both,
        fallbackRole: "guru",
      }),
      "customer",
    );
  });

  it("keeps the Guru inbox on the conversation link", () => {
    assert.equal(
      messageConversationHref("abc", "guru", "/guru/dashboard"),
      "/messages/abc?role=guru&returnTo=%2Fguru%2Fdashboard",
    );
  });

  it("keeps Guru context after a new message is sent", () => {
    assert.equal(
      messageContinuationHref("/messages/abc", "guru", "/guru/dashboard"),
      "/messages/abc?role=guru&returnTo=%2Fguru%2Fdashboard",
    );
  });

  it("keeps Guru context on SitGuru support", () => {
    assert.equal(
      messageSupportHref("guru", "/guru/dashboard"),
      "/messages/admin?role=guru&returnTo=%2Fguru%2Fdashboard",
    );
  });

  it("keeps the current role on search and filters", () => {
    assert.equal(
      messageInboxHref("guru", "/guru/dashboard", "unread", "max"),
      "/messages?role=guru&returnTo=%2Fguru%2Fdashboard&filter=unread&q=max",
    );
  });

  it("preserves an authorized direct link", () => {
    assert.equal(
      headerModeForSharedMessages({
        pathname: "/messages/abc",
        isLoggedIn: true,
        storedRole: "both",
        requestedRole: "guru",
        returnTo: "/guru/dashboard",
        authorizedRoles: both,
      }),
      "guru",
    );
  });

  it("does not grant Guru access from the query alone", () => {
    assert.equal(
      resolveAuthorizedMessagePortal({
        requestedRole: "guru",
        returnTo: "/guru/dashboard",
        authorizedRoles: parentOnly,
        fallbackRole: "customer",
      }),
      "customer",
    );
    assert.equal(
      headerModeForSharedMessages({
        pathname: "/messages",
        isLoggedIn: true,
        storedRole: "customer",
        requestedRole: "guru",
        authorizedRoles: parentOnly,
      }),
      "customer",
    );
    assert.equal(
      resolveAuthorizedMessagePortal({
        requestedRole: "customer",
        authorizedRoles: guruOnly,
        fallbackRole: "guru",
      }),
      "guru",
    );
  });
});
