import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import { useEffect } from "react";

export default function Home() {
  const { data: session }: { data: any } = useSession();

  useEffect(() => {
    document.body.classList.add("__next-auth-theme-auto");

    if (session === undefined) return;

    const params: URLSearchParams = new URLSearchParams(window.location.search);
    const provider: string | null = params.get("provider");

    if (!session) {
      signIn(provider as string);
    }

    // Logout and redirect to the same page if the user is already logged in with a different provider than the requested one
    if (session && provider && provider != session.user.provider) {
      signOut({ redirect: false, callbackUrl: `/?provider=${provider}` });
    }
  }, [session]);

  const confirmOAuthLogin = async () => {
    const response = await fetch("/api/auth/getWalletSeedFromSession");
    if (!response.ok) {
      throw new Error("Failed to fetch wallet seed");
    }

    const { seed }: { seed: string } = await response.json();

    if (window.opener) {
      // Send the seed to the parent window and close the popup
      window.opener.postMessage({ seed }, "*");
      window.close();
    }
  };

  return (
    <>
      <Head>
        <title>Oauth Service</title>
      </Head>

      <div className="page">
        <div className="signin">
          <div className="card">
            {session ? (
              <>
                <h1 style={{ fontSize: "1.7em" }}>
                  You are signed in as {session.user?.email} in{" "}
                  <span style={{ textTransform: "capitalize" }}>
                    {session.user?.provider}
                  </span>
                </h1>{" "}
                <br />
                <button
                  onClick={() => confirmOAuthLogin()}
                  style={{
                    //@ts-ignore-next-line
                    "--provider-bg": "#fff",
                    "--provider-dark-bg": "#006aff",
                    "--provider-color": "#006aff",
                    "--provider-dark-color": "#fff",
                  }}
                >
                  Continue
                </button>
                <button onClick={() => signOut()}>Sign out</button>
              </>
            ) : (
              <>
                Not signed in <br />
                <button onClick={() => signIn()}>Sign in</button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
