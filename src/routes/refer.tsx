import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Link } from "@tanstack/react-router";
import { getReferralSettings, getMyReferralInfo } from "@/fns/referral";
import { useSession } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export const Route = createFileRoute("/refer")({
  loader: () => getReferralSettings(),
  head: () => ({
    meta: [
      { title: "Refer Friends — Murlit Enterprises" },
      { name: "description", content: "Refer friends to Murlit and earn coins. Your friend gets a welcome discount too." },
    ],
  }),
  component: ReferPage,
});

function ReferPage() {
  const s = Route.useLoaderData();
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const [copied, setCopied] = useState(false);

  const coinValue = s.coinValuePaise / 100;
  const welcomeDiscount = s.referralWelcomeDiscount / 100;
  const rewardCoins = s.referralCoinReward;

  const { data: referralInfo } = useQuery({
    queryKey: ["myReferralInfo"],
    queryFn: () => getMyReferralInfo(),
    enabled: isLoggedIn,
  });

  const handleCopy = () => {
    if (!referralInfo?.referralLink) return;
    navigator.clipboard.writeText(referralInfo.referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-ivory">
      <Header />
      <main className="container-x py-16 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">🎁</span>
          <h1 className="font-display text-4xl text-burgundy">Refer Friends</h1>
        </div>
        <p className="text-muted-foreground mb-10">
          Share Murlit with someone you love — they save, you earn.
        </p>

        <div className="grid gap-4 sm:grid-cols-3 mb-10 text-center">
          <div className="rounded-lg border bg-background p-5 shadow-sm">
            <p className="text-3xl mb-2">🔗</p>
            <p className="font-semibold text-sm">Share your link</p>
            <p className="text-xs text-muted-foreground mt-1">Send your unique referral link to a friend</p>
          </div>
          <div className="rounded-lg border bg-background p-5 shadow-sm">
            <p className="text-3xl mb-2">✨</p>
            <p className="font-semibold text-sm">Friend saves ₹{welcomeDiscount}</p>
            <p className="text-xs text-muted-foreground mt-1">Welcome discount on their first order</p>
          </div>
          <div className="rounded-lg border bg-background p-5 shadow-sm">
            <p className="text-3xl mb-2">🪙</p>
            <p className="font-semibold text-sm">You earn {rewardCoins} coins</p>
            <p className="text-xs text-muted-foreground mt-1">= ₹{rewardCoins * coinValue} after their first delivery</p>
          </div>
        </div>

        {isLoggedIn ? (
          referralInfo ? (
            <div className="rounded-lg border border-gold bg-background p-6">
              <h2 className="font-display text-lg text-burgundy mb-4">Your referral link</h2>
              <div className="flex gap-2 items-center">
                <input
                  readOnly
                  value={referralInfo.referralLink}
                  className="flex-1 rounded border bg-sage px-3 py-2 text-sm outline-none font-mono"
                />
                <button
                  onClick={handleCopy}
                  className="shrink-0 rounded-full bg-maroon px-5 py-2 text-sm font-semibold text-on-dark hover:bg-burgundy transition"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                You've referred <strong>{referralInfo.referredCount}</strong> friend{referralInfo.referredCount !== 1 ? "s" : ""}.
                {" "}Coin balance: <strong>{referralInfo.coinBalance} coins</strong> (≈ ₹{referralInfo.coinBalance * coinValue}).
              </p>
            </div>
          ) : (
            <div className="rounded-lg border bg-background p-6 text-center text-sm text-muted-foreground">Loading your referral link…</div>
          )
        ) : (
          <div className="rounded-lg border border-gold bg-background p-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">Login to get your personal referral link.</p>
            <Link to="/login"
              className="inline-block rounded-full bg-maroon px-8 py-3 text-sm font-semibold text-on-dark hover:bg-burgundy transition">
              Login to Get Your Link
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
