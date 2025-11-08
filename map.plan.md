<!-- auto plan -->
# Map Search Overlay & Filter Overlay Update

1. Update `MapSearchOverlay` to support compact/expanded states (width, opacity, focus/hover handling, Escape key).
2. Adjust `TripMap.tsx` overlays: move search overlay props to top-left, relocate filter info block to top-right, ensure responsive styling and z-index.
3. Tweak styles (Tailwind/inline) or add minimal CSS to achieve transitions and max width constraints within right pane limits.

