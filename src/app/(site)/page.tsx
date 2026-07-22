import Link from "next/link";

export default function AboutPage() {
  return (
    <p className="text-muted leading-relaxed text-lg">
      i&apos;m currently studying computer science at{" "}
      <span className="whitespace-nowrap text-foreground">
        <img
          src="/images/uwaterloo.7db97a20.svg"
          alt=""
          className="mr-1 inline-block h-[1em] w-[1em] rounded-sm align-[-0.15em] opacity-85"
        />
        UWaterloo
      </span>{" "}
      &amp; working at{" "}
      <a
        href="https://www.tribalscale.com"
        target="_blank"
        rel="noreferrer"
        className="whitespace-nowrap text-foreground border-b border-transparent hover:border-current"
      >
        <img
          src="/images/tribalscale.36350c1c.jpg"
          alt=""
          className="mr-1 inline-block h-[1em] w-[1em] rounded-sm align-[-0.15em] opacity-85"
        />
        TribalScale
      </a>
      {" as a software engineer."}
      <br />
      <br />
      i live to{" "}
      <Link href="/other" className="text-foreground underline-offset-4 hover:underline">
        eat
      </Link>
      ,{" "}
      <Link href="/other" className="text-foreground underline-offset-4 hover:underline">
        listen
      </Link>
      , and{" "}
      <Link href="/other" className="text-foreground underline-offset-4 hover:underline">
        travel
      </Link>
      .
      <br />
      <br />
      when i retire at 29, you can find me on my tea farm in{" "}
      <a
        href="https://en.wikipedia.org/wiki/Yixing"
        target="_blank"
        rel="noreferrer"
        className="whitespace-nowrap text-foreground border-b border-transparent hover:border-current"
      >
        yixing, china
      </a>
      .
    </p>
  );
}
