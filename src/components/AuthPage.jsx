import { SignIn } from '@clerk/react';
import { CheckSquare } from 'lucide-react';

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <CheckSquare size={22} className="text-white" />
          </div>
          <span className="font-bold text-2xl text-white">TaskFlow</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Manage your tasks,<br />master your day.
          </h1>
          <p className="text-primary-foreground/70 text-lg">
            Track completions, visualise streaks, and stay on top of every goal — all in one place.
          </p>
        </div>

        <div className="flex gap-8 text-white/60 text-sm">
          <div>
            <div className="text-3xl font-bold text-white mb-1">∞</div>
            <div>Tasks supported</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white mb-1">365</div>
            <div>Day history</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white mb-1">100%</div>
            <div>Free to start</div>
          </div>
        </div>
      </div>

      {/* Right auth panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <CheckSquare size={16} className="text-white" />
          </div>
          <span className="font-bold text-xl text-foreground">TaskFlow</span>
        </div>

        <SignIn
          appearance={{
            elements: {
              rootBox: 'w-full max-w-md',
              card: 'bg-card border border-border shadow-lg rounded-2xl',
              headerTitle: 'text-foreground',
              headerSubtitle: 'text-muted-foreground',
              formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
              footerActionLink: 'text-primary hover:text-primary/80',
            },
          }}
        />
      </div>
    </div>
  );
}
