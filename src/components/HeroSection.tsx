import React from 'react'
import { Button } from './ui/button'
import { AnimatedShinyText } from './ui/animated-shiny-text'
import { cn } from '@/lib/utils'
import { ArrowRightIcon } from 'lucide-react'

function HeroSection() {
    return (
        <div className='flex flex-col items-center justify-center pb-20 h-screen gap-14 text-white'>
            <div
                className={cn(
                    "group rounded-full border border-black/5 bg-neutral-100 text-base text-white transition-all ease-in hover:cursor-pointer hover:bg-neutral-200 dark:border-white/5 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                )}
            >
                <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1 transition ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400">
                    <span className='text-sm'>✨ Introducing Interview Prep AI</span>
                    <ArrowRightIcon className="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
                </AnimatedShinyText>
            </div>
            <div className='flex flex-col text-7xl font-bold text-center'>
                <h1 className='text-black'>Ace your interviews with</h1>
                <h1 className='text-blue-400'>AI-powered preparation</h1>
            </div>

            <div className='text-center text-lg max-w-2xl text-gray-600'>
                <p>Prepare for interviews like never before with our AI-powered assistant. Get<br />personalized feedback, practice with realistic simulations, and land your dream <br />job</p>
            </div>

            <div className='flex gap-4'>
                <Button className='bg-blue-500 hover:bg-blue-400 rounded-full cursor-pointer text-white'>Get Started</Button>
                <Button className='border border-black rounded-full hover:bg-gray-200 cursor-pointer text-black' variant={'outline'}>Learn More</Button>
            </div>
        </div>
    )
}

export default HeroSection
