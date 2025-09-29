import Link from 'next/link'
import React from 'react'
import { Button } from './ui/button'
import { Separator } from './ui/separator'
import { ArrowRight } from 'lucide-react'

function NavBar() {
    return (
        <header>
            <div className='w-full h-20 flex items-center justify-between pl-7 pr-7'>
                <Link href="/" className="text-lg font-bold">🤖Interview Prep AI</Link>

                <nav className='flex gap-8'>

                    <Link href="/features" className="">Features</Link>
                    <Link href="/pricing" className="">Pricing</Link>
                    <Link href="/about" className="">About</Link>
                </nav>

                <div className='flex gap-4'>
                    <Button id='' className="cursor-pointer hover:bg-blue-300 bg-blue-400" variant={'default'}>
                        Get Started
                        <ArrowRight className='flex items-center justify-center h-4 w-4' />
                    </Button>
                </div>
            </div>
            <Separator />
        </header>
    )
}

export default NavBar
