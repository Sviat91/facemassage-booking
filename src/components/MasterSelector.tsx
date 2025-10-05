"use client"
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { getAllMasters, type MasterId } from '@/config/masters'
import { useMaster } from '@/contexts/MasterContext'

/**
 * Master Selector Component
 * Displays two master cards with photos and names
 * Handles selection and navigation to master-specific page
 */
export default function MasterSelector() {
  const router = useRouter()
  const { setMaster } = useMaster()
  const masters = getAllMasters()

  const handleMasterSelect = (masterId: MasterId) => {
    // Set master in context (saves to localStorage)
    setMaster(masterId)
    
    // Navigate to master-specific page
    router.push(`/${masterId}`)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl sm:text-5xl font-bold text-text dark:text-dark-text mb-4">
          Wybierz swojego mistrza
        </h1>
        <p className="text-lg text-muted dark:text-dark-muted">
          Zarezerwuj wizytę u wybranego specjalisty
        </p>
      </motion.div>

      {/* Master Cards */}
      <div className="flex flex-col portrait:flex-col landscape:flex-row gap-8 w-full max-w-4xl justify-center items-center">
        {masters.map((master, index) => (
          <motion.button
            key={master.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              duration: 0.5, 
              delay: index * 0.2,
              type: "spring",
              stiffness: 100 
            }}
            whileHover={{ 
              scale: 1.05,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleMasterSelect(master.id as MasterId)}
            className="group relative w-full max-w-xs aspect-square rounded-3xl overflow-hidden shadow-2xl focus:outline-none focus:ring-4 focus:ring-accent/50 transition-all duration-300"
          >
            {/* Master Photo */}
            <div className="relative w-full h-full">
              <Image
                src={master.avatar}
                alt={`${master.name} - Beauty Master`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
            </div>

            {/* Master Name */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2 transform group-hover:translate-y-[-4px] transition-transform duration-300">
                {master.name}
              </h2>
              <div className="flex items-center justify-center gap-2 text-white/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-sm font-medium">Zarezerwuj wizytę</span>
                <svg 
                  className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Decorative Border */}
            <div className="absolute inset-0 rounded-3xl ring-2 ring-white/10 pointer-events-none" />
          </motion.button>
        ))}
      </div>

      {/* Subtle hint text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="mt-12 text-sm text-muted dark:text-dark-muted text-center max-w-md"
      >
        Twój wybór zostanie zapamiętany dla wygodniejszego korzystania z systemu rezerwacji
      </motion.p>
    </div>
  )
}
