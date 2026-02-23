/// <reference types="react-scripts" />
/// <reference types="vite/client" />

declare module 'd3-force-3d' {
  export function forceRadial(radius?: number, x?: number, y?: number, z?: number): {
    strength(s: number): any;
    radius(r: number): any;
  };
  export function forceCenter(x?: number, y?: number, z?: number): any;
  export function forceManyBody(): any;
  export function forceLink(links?: any[]): any;
  export function forceSimulation(nodes?: any[]): any;
}
