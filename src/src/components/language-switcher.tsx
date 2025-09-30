'use client';
import type { Dispatch, SetStateAction } from 'react';
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Globe } from 'lucide-react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';

interface LanguageSwitcherProps {
  selectedLanguage: GenerateNotificationInput['languagePreference'];
  setLanguage: Dispatch<SetStateAction<GenerateNotificationInput['languagePreference']>>;
}

export function LanguageSwitcher({ selectedLanguage, setLanguage }: LanguageSwitcherProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLanguage('en')} disabled={selectedLanguage === 'en'}>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage('fr')} disabled={selectedLanguage === 'fr'}>
          Français
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage('es')} disabled={selectedLanguage === 'es'}>
          Español
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
