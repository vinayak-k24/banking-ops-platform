---
applyTo: "src/**/*.{ts,tsx}"
---

# Frontend (Next.js) instructions

- Next.js 15 App Router, React 19, TypeScript strict, Tailwind 3. Path alias `@/` = `src/`.
- Pages: `src/app/(dashboard)/<id>/page.tsx` renders `src/components/pages/<Name>Page.tsx` (client component).
- Backend access only via `src/lib/api.ts`; keep `src/lib/types.ts` in sync with backend responses.
- Use `useDashboard()` for modal, navigation (`switchPage`), persona (`actor`) and actions.
- Keep the existing look: theme colors `slateDark`, `coralRed`, `accentBlue`; `action-btn-black`; rounded-2xl white cards; Font Awesome `fa-solid` icons.
- Charts: Chart.js via `react-chartjs-2`, register elements in the chart module.
