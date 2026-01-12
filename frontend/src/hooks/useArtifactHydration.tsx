
import { useEffect, useRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
// @ts-ignore - ArtifactRenderer export issues
import { ArtifactRenderer } from '../components/chat/ArtifactRenderer';
import type { Artifact } from '../types/api';

/**
 * Hook to hydrate visualization placeholders with ArtifactRenderer components.
 * 
 * Scans the provided containerRef for elements with class 'visualization-placeholder',
 * extracts their data-id, and renders the corresponding artifact from the embeddedArtifacts map.
 */
export function useArtifactHydration(
    containerRef: React.RefObject<HTMLElement>,
    embeddedArtifacts: Record<string, Artifact> | Map<string, Artifact> | undefined,
    dependency: any = null // Optional dependency to trigger re-hydration (e.g. content string)
) {
    const rootsRef = useRef<Root[]>([]);

    useEffect(() => {
        if (!containerRef.current || !embeddedArtifacts) {
            return;
        }

        const rootElement = containerRef.current;

        // Cleanup old roots if running again
        const cleanup = () => {
            rootsRef.current.forEach(r => {
                try { setTimeout(() => r.unmount(), 0); } catch (_) { }
            });
            rootsRef.current = [];
        };
        cleanup();

        // Helper to check if we have any artifacts
        const hasArtifacts = embeddedArtifacts instanceof Map
            ? embeddedArtifacts.size > 0
            : Object.keys(embeddedArtifacts).length > 0;

        // 4. Hydrate visualization placeholders
        if (hasArtifacts) {
            const placeholders = rootElement.querySelectorAll('.visualization-placeholder');

            placeholders.forEach((el) => {
                const dataId = el.getAttribute('data-id');

                let artifactToRender: Artifact | undefined;
                if (dataId) {
                    if (embeddedArtifacts instanceof Map) {
                        artifactToRender = embeddedArtifacts.get(dataId);
                    } else {
                        artifactToRender = embeddedArtifacts[dataId];
                    }
                }

                if (artifactToRender) {
                    try {
                        // Create a root and render the artifact

                        // Clear the placeholder text
                        el.innerHTML = '';
                        // Remove the placeholder styling to let the artifact expand
                        el.className = 'hydrated-visualization-container';
                        (el as HTMLElement).style.background = 'transparent';
                        (el as HTMLElement).style.border = 'none';
                        (el as HTMLElement).style.padding = '0';
                        // Fix visibility issues: Ensure block display and definite width
                        (el as HTMLElement).style.display = 'block';
                        (el as HTMLElement).style.width = '100%';
                        (el as HTMLElement).style.height = '450px'; // Enforce explicit height for Recharts

                        const reactRoot = createRoot(el);
                        rootsRef.current.push(reactRoot);

                        reactRoot.render(
                            <div style={{ width: '100%', height: '100%', minHeight: '400px' }}>
                                <ArtifactRenderer artifact={artifactToRender} />
                            </div>
                        );
                    } catch (err) {
                        console.error('[useArtifactHydration] Failed to hydrate visualization:', err);
                    }
                }
            });
        }

        return cleanup;
    }, [embeddedArtifacts, dependency]);
}
