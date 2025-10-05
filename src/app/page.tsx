"use client"
import MasterSelector from '@/components/MasterSelector'
import ThemeToggle from '@/components/ThemeToggle'
import Image from 'next/image'

/**
 * Landing Page - Master Selection
 * First page users see when visiting the site
 * Allows selection between different beauty masters
 */
export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col relative">
      <ThemeToggle />
      
      {/* Desktop Logo - top left */}
      <div className="absolute left-4 top-4 z-10 hidden lg:block">
        {/* Light theme */}
        <Image
          src="/head_logo.png"
          alt="Logo Somique Beauty"
          width={242}
          height={97}
          className="h-auto dark:hidden"
          priority
        />
        {/* Dark theme */}
        <Image
          src="/head_logo_night.png"
          alt="Logo Somique Beauty"
          width={242}
          height={97}
          className="h-auto hidden dark:block"
          priority
        />
      </div>

      {/* Mobile Logo - centered */}
      <div className="block lg:hidden mt-8 mb-4 px-4 text-center">
        {/* Light theme */}
        <Image
          src="/head_logo.png"
          alt="Logo Somique Beauty"
          width={200}
          height={80}
          className="h-auto max-w-[180px] sm:max-w-[200px] mx-auto dark:hidden"
          priority
        />
        {/* Dark theme */}
        <Image
          src="/head_logo_night.png"
          alt="Logo Somique Beauty"
          width={200}
          height={80}
          className="h-auto max-w-[180px] sm:max-w-[200px] mx-auto hidden dark:block"
          priority
        />
      </div>

      {/* Master Selector */}
      <div className="flex-1 flex items-center justify-center px-4">
        <MasterSelector />
      </div>
    </main>
  )
}
