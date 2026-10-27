import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Link } from "@tanstack/react-router";
import { getReferralSettings } from "@/fns/referral";
import { useSession } from "@/lib/auth-client";

export const Route = createFileRoute("/murlit-coins")({
  loader: () => getReferralSettings(),
  head: () => ({
    meta: [
      { title: "Murlit Coins — Murlit Enterprises" },
      { name: "description", content: "Earn Murlit Coins by referring friends and redeem them on your next order." },
    ],
  }),
  component: MurlitCoinsPage,
});

function MurlitCoinsPage() {
  const s = Route.useLoaderData();
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  const coinValue = s.coinValuePaise / 100; // ₹ per coin
  const welcomeDiscount = s.referralWelcomeDiscount / 100; // ₹
  const maxPct = s.maxCoinsPctPerOrder;
  const expiryDays = s.coinExpiryDays;
  const rewardCoins = s.referralCoinReward;

  return (
    <div className="min-h-screen bg-ivory">
      <Header />
      <main className="container-x py-16 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">🪙</span>
          <h1 className="font-display text-4xl text-burgundy">Murlit Coins</h1>
        </div>
        <p className="text-muted-foreground mb-10">
          Earn coins, save on every order.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 mb-10">
          <div className="rounded-lg border bg-background p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Coin value</p>
            <p className="font-display text-3xl text-maroon">1 coin = ₹{coinValue}</p>
          </div>
          <div className="rounded-lg border bg-background p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Max coins per order</p>
            <p className="font-display text-3xl text-maroon">Up to {maxPct}%</p>
            <p className="text-xs text-muted-foreground mt-1">of the order value</p>
          </div>
          <div className="rounded-lg border bg-background p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Referral reward</p>
            <p className="font-display text-3xl text-maroon">{rewardCoins} coins</p>
            <p className="text-xs text-muted-foreground mt-1">= ₹{rewardCoins * coinValue} when your friend's first order ships</p>
          </div>
          <div className="rounded-lg border bg-background p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Coins expire after</p>
            <p className="font-display text-3xl text-maroon">{expiryDays} days</p>
          </div>
        </div>

        <div className="rounded-lg border border-gold bg-background p-6 mb-8">
          <h2 className="font-display text-xl text-burgundy mb-3">How to earn coins</h2>
          <ol className="space-y-3 text-sm text-muted-foreground list-decimal pl-5">
            <li>Refer a friend using your personal referral link.</li>
            <li>Your friend signs up and gets ₹{welcomeDiscount} off their first order.</li>
            <li>Once their first order is delivered, you earn <strong className="text-ink">{rewardCoins} Murlit Coins</strong> (worth ₹{rewardCoins * coinValue}).</li>
            <li>Use coins at checkout — up to {maxPct}% of your order total.</li>
          </ol>
        </div>

        <div className="text-center">
          {isLoggedIn ? (
            <Link to="/account" search={{ tab: "refer" } as any}
              className="inline-block rounded-full bg-maroon px-8 py-3 text-sm font-semibold text-on-dark hover:bg-burgundy transition">
              View My Coins & Referral Link →
            </Link>
          ) : (
            <Link to="/login"
              className="inline-block rounded-full bg-maroon px-8 py-3 text-sm font-semibold text-on-dark hover:bg-burgundy transition">
              Login to Start Earning
            </Link>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
