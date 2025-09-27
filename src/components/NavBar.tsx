import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
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
                {/* signed out links */}
                <SignedOut>
                        <Link href="/features" className="">Features</Link>
                        <Link href="/pricing" className="">Pricing</Link>
                    <Link href="/recruiter-login" className="">For Recruiters</Link>
                </SignedOut>

                {/* signed in links */}
                <SignedIn>
                    <Link href="/dashboard" className="">Dashboard</Link>
                    <Link href="/profile" className="">Profile</Link>
                </SignedIn>
            </nav>

            <div className='flex gap-4'>
                <SignedOut>
                    <SignInButton mode='modal'>
                        <Button variant={'outline'} className='cursor-pointer'>Sign Up</Button>
                    </SignInButton>
                    <SignUpButton mode='modal'>
                        <Button className="cursor-pointer bg-blue-400" variant={'default'}>
                            Sign In 
                            <ArrowRight className='flex items-center justify-center h-4 w-4' />
                        </Button>
                    </SignUpButton>
                </SignedOut>
                <SignedIn>
                    <UserButton afterSignOutUrl='/' />
                </SignedIn>
            </div>
        </div>
        <Separator />
        </header>
    )
}

export default NavBar
