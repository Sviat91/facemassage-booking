import Image from 'next/image'

export default function Page() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
      <Image src="/logo.png" alt="logo" width={120} height={120} priority />
      <h1 className="text-2xl md:text-3xl font-semibold">Book your session</h1>
      <p className="text-muted max-w-prose text-center">
        Minimal skeleton ready. Next step: connect Google Sheets and render procedures + calendar.
      </p>
      <div className="flex gap-3">
        <a className="btn btn-primary" href="/api/health">API health</a>
      </div>
    </main>
  )
}

