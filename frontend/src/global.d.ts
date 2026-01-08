import * as React from 'react';

// Add missing SVG element typings to JSX.IntrinsicElements if they aren't picked up
// This helps TypeScript recognize <svg>, <path>, etc. in JSX in edge cases
declare global {
  namespace JSX {
    interface IntrinsicElements {
      svg: React.SVGProps<SVGSVGElement>;
      path: React.SVGProps<SVGPathElement>;
      circle: React.SVGProps<SVGCircleElement>;
      rect: React.SVGProps<SVGRectElement>;
      line: React.SVGProps<SVGLineElement>;
      polyline: React.SVGProps<SVGPolylineElement>;
      polygon: React.SVGProps<SVGPolygonElement>;
      g: React.SVGProps<SVGGElement>;
      defs: React.SVGProps<SVGDefsElement>;
      foreignObject: React.SVGProps<SVGForeignObjectElement>;
      [elemName: string]: any;
    }
  }
}

export {};
