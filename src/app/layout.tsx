import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Geist_Mono } from 'next/font/google';
import './globals.css';

const sans = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

const mono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'FinSort \u2014 Smart Transaction Categorizer',
  description:
    'Upload your bank CSV and get AI-powered spending categorization and insights.',
};

const themeScript = `(function(){try{var t=localStorage.getItem('finsort-theme');if(t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${sans.variable} ${mono.variable} antialiased min-h-screen bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-50 transition-colors duration-200`}
      >
        {children}
      </body>
    </html>
  );
}
