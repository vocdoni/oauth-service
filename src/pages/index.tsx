import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import { useEffect } from "react";

export default function Home() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session === undefined) return;

    if (!session) {
      signIn();
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

      {session ? (
        <>
          {" "}
          Signed in as {session.user?.email} <br />
          <button onClick={() => signOut()}>Sign out</button>
          <button onClick={() => confirmOAuthLogin()}>Continue</button>
        </>
      ) : (
        <>
          Not signed in <br />
          <button onClick={() => signIn()}>Sign in</button>
        </>
      )}
    </>
  );
}
