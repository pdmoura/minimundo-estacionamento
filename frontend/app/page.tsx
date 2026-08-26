import Image from "next/image";

export default function Home() {
  return (
    <div className="min-vh-100 bg-light d-flex align-items-center">
      <main className="container bg-white rounded-3 shadow-sm p-5 my-5">
        <Image
          className="mb-5"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div>
          <h1 className="display-6 fw-semibold">
            To get started, edit the{" "}
            <code>
              page.tsx
            </code>{" "}
            file.
          </h1>
          <p className="lead text-secondary mt-4">
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <div className="d-flex flex-column flex-sm-row gap-3 mt-5">
          <a
            className="btn btn-dark d-inline-flex align-items-center justify-content-center gap-2"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={14}
            />
            Deploy Now
          </a>
          <a
            className="btn btn-outline-secondary"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
