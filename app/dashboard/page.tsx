        if (typedIsProvider) {
          const { data: sitterData } = await supabase
            .from("sitters")
            .select(`
              id,
              profile_id,
              slug,
              full_name,
              title,
              city,
              state,
              rating,
              review_count,
              response_time,
              is_verified,
              services,
              referral_code,
              referral_points,
              total_referrals,
              is_active
            `)
            .eq("profile_id", user.id)
            .maybeSingle();

          if (sitterData) {
            setSitter(sitterData as DashboardSitter);
          }

          const providerId = sitterData?.id || "00000000-0000-0000-0000-000000000000";

          // Fixed queries - properly awaited
          const bookingQuery = supabase
            .from("bookings")
            .select("id, pet_name, service, booking_date, status, price, pet_type, city, state, customer_id, sitter_id")
            .eq("sitter_id", providerId)
            .order("booking_date", { ascending: false })
            .limit(50);

          const reviewQuery = supabase
            .from("reviews")
            .select("id, reviewer_name, rating, comment, created_at")
            .eq("sitter_id", providerId)
            .order("created_at", { ascending: false })
            .limit(20);

          const mediaQuery = supabase
            .from("provider_media")
            .select("id, profile_id, file_url, file_type, caption, created_at")
            .eq("profile_id", user.id)
            .order("created_at", { ascending: false })
            .limit(20);

          const commissionQuery = supabase
            .from("referral_commissions")
            .select("id, status, calculated_payout, approved_payout, created_at")
            .eq("referrer_profile_id", user.id)
            .order("created_at", { ascending: false })
            .limit(20);

          const [bookingRows, reviewRows, mediaRows, commissionRows] = await Promise.all([
            safeSelect<BookingRow>(bookingQuery),
            safeSelect<ReviewRow>(reviewQuery),
            safeSelect<ProviderMediaRow>(mediaQuery),
            safeSelect<ReferralCommission>(commissionQuery),
          ]);

          setProviderBookings(bookingRows);
          setProviderReviews(reviewRows);
          setProviderMedia(mediaRows);
          setCommissions(commissionRows);

          // Activity setup (unchanged)
          const reviewActivity: ActivityItem[] = reviewRows.slice(0, 4).map((review) => ({
            id: `review-${review.id}`,
            label: `${review.reviewer_name || "Client"} left a ${formatRating(review.rating)}★ review`,
            time: timeAgo(review.created_at),
            tone: "good",
          }));

          const bookingActivity: ActivityItem[] = bookingRows.slice(0, 4).map((booking) => ({
            id: `booking-${booking.id}`,
            label: `${booking.pet_name || "A pet"} booking is ${String(booking.status || "updated").toLowerCase()}`,
            time: formatDateLabel(booking.booking_date),
            tone: String(booking.status || "").toLowerCase() === "pending" ? "alert" : "neutral",
          }));

          setActivity([...reviewActivity, ...bookingActivity].slice(0, 8));
        } else {
          // Customer loading remains the same as before
          const [petRows, petMediaRows, bookingRows, storyRows, messageRows] = await Promise.all([
            safeSelect<PetRow>(
              supabase
                .from("pets")
                .select("*")
                .eq("owner_profile_id", user.id)
                .order("created_at", { ascending: false })
            ),
            safeSelect<PetMediaRow>(
              supabase
                .from("pet_media")
                .select("*")
                .eq("owner_profile_id", user.id)
                .order("created_at", { ascending: false })
                .limit(30)
            ),
            safeSelect<BookingRow>(
              supabase
                .from("bookings")
                .select("*")
                .eq("customer_id", user.id)
                .order("booking_date", { ascending: false })
                .limit(30)
            ),
            safeSelect<PetStoryRow>(
              supabase
                .from("pet_stories")
                .select("*")
                .eq("owner_profile_id", user.id)
                .order("created_at", { ascending: false })
                .limit(20)
            ),
            safeSelect<MessageRow>(
              supabase
                .from("messages")
                .select("*")
                .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
                .order("created_at", { ascending: false })
                .limit(100)
            ),
          ]);

          setPets(petRows);
          setPetMedia(petMediaRows);
          setCustomerBookings(bookingRows);
          setPetStories(storyRows);
          setMessages(messageRows);
        }