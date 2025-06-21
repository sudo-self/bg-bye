export function FixedFooter() {
  return (
    <footer className="fixed bottom-0 left-0 w-full bg-gray-50 dark:bg-gray-950 py-2 text-center flex justify-center items-center gap-2">
      <img src="/wind.svg" alt="Wind icon" className="w-8 h-8" />
      <a
        href="https://bg-bye-bye.vercel.app"
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-600 dark:text-gray-300 hover:underline cursor-pointer"
      >
        bg-bye-bye
      </a>
    </footer>
  )
}
