import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "other",
  description: "food, music, and travel",
};

export default function OtherPage() {
  return (
    <p className="text-muted leading-relaxed text-lg">
      i rank every place i eat on beli{" "}
      <span className="text-foreground">@felixpan</span>. my top-rated spot is{" "}
      <a
        href="https://maps.app.goo.gl/MyCh9r3YLmio7fGu5"
        target="_blank"
        rel="noreferrer"
        className="text-foreground underline-offset-4 hover:underline"
      >
        Namaste Nepal
      </a>
      , a nepalese restaurant in tokyo.
      <br />
      <br />
      my favorite artist right now is{" "}
      <a
        href="https://open.spotify.com/artist/1swF0fjO1rWmJEbygzTpf2"
        target="_blank"
        rel="noreferrer"
        className="text-foreground underline-offset-4 hover:underline"
      >
        reiko
      </a>
      . here&apos;s my top 3:
      <br />
      <a
        href="https://open.spotify.com/track/5tdLqrYYsKP5TxT8RJ3VtQ"
        target="_blank"
        rel="noreferrer"
        className="text-foreground underline-offset-4 hover:underline"
      >
        wantmetoo · reiko
      </a>
      <br />
      <a
        href="https://open.spotify.com/track/6Cgdqm78siouXhd4NlMYn3"
        target="_blank"
        rel="noreferrer"
        className="text-foreground underline-offset-4 hover:underline"
      >
        maybes · reiko
      </a>
      <br />
      <a
        href="https://open.spotify.com/track/4xVoUumxOenynyfVwoZGZi?si=d3defcfdddef45da"
        target="_blank"
        rel="noreferrer"
        className="text-foreground underline-offset-4 hover:underline"
      >
        worth your time / nothing at all · kiyu, reiko
      </a>
      <br />
      <br />
      so far i&apos;ve gone on{" "}
      <span className="text-foreground font-medium">28</span> major trips in my{" "}
      <span className="text-foreground font-medium">19</span> years of living.
      <br />
      this winter i&apos;m planning to travel to{" "}
      <span className="text-foreground">south korea</span> and revisit{" "}
      <span className="text-foreground">china</span>.
    </p>
  );
}
