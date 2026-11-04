/**
 * Page transition: each route fades up slightly on entry.
 * Pure CSS (see .page-enter in globals.css) so it runs before JavaScript loads and never
 * leaves content invisible on slow phones. `animation-fill-mode: backwards` means no transform
 * remains afterwards, so position:fixed children (contact bar, dialogs) stay fixed to the screen.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
