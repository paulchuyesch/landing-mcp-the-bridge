"use client";

export function IsometricGrid() {
  const renderStoreNode = (col: number, row: number) => {
    const x = col * 60 + 12;
    const y = row * 60 + 12;

    return (
      <g>
        <rect x={x} y={y} width="36" height="36" rx="3" fill="#09090b" stroke="#f97316" strokeWidth="1.4" />
        <path
          d={`M ${x + 10} ${y + 12} H ${x + 24} L ${x + 22.5} ${y + 20} H ${x + 12} Z`}
          fill="none"
          stroke="#f97316"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d={`M ${x + 11} ${y + 12} L ${x + 9} ${y + 9}`}
          fill="none"
          stroke="#f97316"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx={x + 14} cy={y + 24} r="1.5" fill="#f97316" />
        <circle cx={x + 21} cy={y + 24} r="1.5" fill="#f97316" />
      </g>
    );
  };

  const renderBridgeNode = (col: number, row: number) => {
    const x = col * 60 + 12;
    const y = row * 60 + 12;

    return (
      <g>
        <rect x={x} y={y} width="36" height="36" rx="3" fill="#09090b" stroke="#f97316" strokeWidth="1.4" />
        <image href="/favicon.svg" x={x + 8} y={y + 7} width="20" height="22" preserveAspectRatio="xMidYMid meet" />
      </g>
    );
  };

  const renderAgentNode = (col: number, row: number) => {
    const x = col * 60 + 12;
    const y = row * 60 + 12;

    return (
      <g>
        <rect x={x} y={y} width="36" height="36" rx="3" fill="#09090b" stroke="#f97316" strokeWidth="1.4" />
        <rect x={x + 10} y={y + 12} width="16" height="11" rx="2.2" fill="none" stroke="#f97316" strokeWidth="1.5" />
        <line x1={x + 18} y1={y + 12} x2={x + 18} y2={y + 9} stroke="#f97316" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx={x + 18} cy={y + 7.8} r="1.15" fill="#f97316" />
        <circle cx={x + 14.2} cy={y + 17.1} r="1.15" fill="#f97316" />
        <circle cx={x + 21.8} cy={y + 17.1} r="1.15" fill="#f97316" />
        <line x1={x + 14} y1={y + 20.2} x2={x + 22} y2={y + 20.2} stroke="#f97316" strokeWidth="1.35" strokeLinecap="round" />
        <line x1={x + 8.5} y1={y + 15} x2={x + 10} y2={y + 15} stroke="#f97316" strokeWidth="1.3" strokeLinecap="round" />
        <line x1={x + 8.5} y1={y + 20} x2={x + 10} y2={y + 20} stroke="#f97316" strokeWidth="1.3" strokeLinecap="round" />
        <line x1={x + 26} y1={y + 15} x2={x + 27.5} y2={y + 15} stroke="#f97316" strokeWidth="1.3" strokeLinecap="round" />
        <line x1={x + 26} y1={y + 20} x2={x + 27.5} y2={y + 20} stroke="#f97316" strokeWidth="1.3" strokeLinecap="round" />
      </g>
    );
  };

  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 720 720"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      {/* Grid lines */}
      {[...Array(13)].map((_, i) => (
        <line key={`h-${i}`} x1={0} y1={60 * i} x2={720} y2={60 * i} stroke="#27272a" strokeWidth="1" />
      ))}
      {[...Array(13)].map((_, i) => (
        <line key={`v-${i}`} x1={60 * i} y1={0} x2={60 * i} y2={720} stroke="#27272a" strokeWidth="1" />
      ))}

      {/*
        Nodes - positioned by cell (col, row)
        Node rect: x = col*60 + 12, y = row*60 + 12, size 36x36
        Node center: col*60 + 30, row*60 + 30

        ISLANDS - grupos separados, posiciones orgánicas/caóticas
      */}

      {/* ===== ISLA 1: Top Left ===== */}
      {renderStoreNode(1, 1)} {/* Store */}
      {renderBridgeNode(3, 2)} {/* Bridge */}
      {renderAgentNode(2, 4)} {/* Agent */}

      <line x1={1 * 60 + 30} y1={1 * 60 + 30} x2={3 * 60 + 30} y2={2 * 60 + 30} stroke="#ffffff" strokeWidth="1.5" strokeDasharray="6,6" className="animate-flow" />
      <line x1={3 * 60 + 30} y1={2 * 60 + 30} x2={2 * 60 + 30} y2={4 * 60 + 30} stroke="#ffffff" strokeWidth="1.5" strokeDasharray="6,6" className="animate-flow-reverse" />

      {/* ===== ISLA 2: Top Right ===== */}
      {renderStoreNode(8, 1)} {/* Store */}
      {renderBridgeNode(10, 3)} {/* Bridge */}
      {renderAgentNode(9, 5)} {/* Agent */}

      <line x1={8 * 60 + 30} y1={1 * 60 + 30} x2={10 * 60 + 30} y2={3 * 60 + 30} stroke="#ffffff" strokeWidth="1.5" strokeDasharray="6,6" className="animate-flow" />
      <line x1={10 * 60 + 30} y1={3 * 60 + 30} x2={9 * 60 + 30} y2={5 * 60 + 30} stroke="#ffffff" strokeWidth="1.5" strokeDasharray="6,6" className="animate-flow-reverse" />

      {/* ===== ISLA 3: Bottom Left ===== */}
      {renderStoreNode(2, 7)} {/* Store */}
      {renderBridgeNode(1, 9)} {/* Bridge */}
      {renderAgentNode(4, 10)} {/* Agent */}

      <line x1={2 * 60 + 30} y1={7 * 60 + 30} x2={1 * 60 + 30} y2={9 * 60 + 30} stroke="#ffffff" strokeWidth="1.5" strokeDasharray="6,6" className="animate-flow" />
      <line x1={1 * 60 + 30} y1={9 * 60 + 30} x2={4 * 60 + 30} y2={10 * 60 + 30} stroke="#ffffff" strokeWidth="1.5" strokeDasharray="6,6" className="animate-flow-reverse" />

      {/* ===== ISLA 4: Bottom Right ===== */}
      {renderStoreNode(9, 8)} {/* Store */}
      {renderBridgeNode(11, 9)} {/* Bridge */}
      {renderAgentNode(8, 10)} {/* Agent */}

      <line x1={9 * 60 + 30} y1={8 * 60 + 30} x2={11 * 60 + 30} y2={9 * 60 + 30} stroke="#ffffff" strokeWidth="1.5" strokeDasharray="6,6" className="animate-flow" />
      <line x1={11 * 60 + 30} y1={9 * 60 + 30} x2={8 * 60 + 30} y2={10 * 60 + 30} stroke="#ffffff" strokeWidth="1.5" strokeDasharray="6,6" className="animate-flow-reverse" />

      {/* ===== ISLA 5: Center ===== */}
      {renderStoreNode(5, 5)} {/* Store */}
      {renderBridgeNode(6, 4)} {/* Bridge */}
      {renderAgentNode(5, 3)} {/* Agent */}

      <line x1={5 * 60 + 30} y1={5 * 60 + 30} x2={6 * 60 + 30} y2={4 * 60 + 30} stroke="#ffffff" strokeWidth="1.5" strokeDasharray="6,6" className="animate-flow" />
      <line x1={6 * 60 + 30} y1={4 * 60 + 30} x2={5 * 60 + 30} y2={3 * 60 + 30} stroke="#ffffff" strokeWidth="1.5" strokeDasharray="6,6" className="animate-flow-reverse" />

      {/* ===== ISLA 6: Bottom Center ===== */}
      {renderStoreNode(4, 7)} {/* Store */}
      {renderBridgeNode(6, 8)} {/* Bridge */}
      {renderAgentNode(5, 6)} {/* Agent */}

      <line x1={4 * 60 + 30} y1={7 * 60 + 30} x2={6 * 60 + 30} y2={8 * 60 + 30} stroke="#ffffff" strokeWidth="1.5" strokeDasharray="6,6" className="animate-flow" />
      <line x1={6 * 60 + 30} y1={8 * 60 + 30} x2={5 * 60 + 30} y2={6 * 60 + 30} stroke="#ffffff" strokeWidth="1.5" strokeDasharray="6,6" className="animate-flow-reverse" />

      {/* ===== CURSORES COLABORATIVOS ===== */}
      {/* Path 1: Curvas orgánicas por zona izquierda */}
      <path
        id="cursor-path-1"
        d="M 90,30
           C 200,60 120,150 150,90
           C 180,140 280,180 210,210
           Q 150,300 90,390
           C 40,450 80,480 30,510
           Q 100,550 150,570
           C 250,520 280,480 330,450
           Q 380,500 390,570
           C 320,620 300,600 270,630
           Q 180,400 90,30"
        fill="none"
        stroke="none"
      />
      {/* Path 2: Curvas orgánicas por zona derecha */}
      <path
        id="cursor-path-2"
        d="M 450,270
           C 520,220 580,240 630,210
           Q 620,280 570,330
           C 630,340 660,320 690,330
           Q 650,200 570,90
           C 620,300 650,400 630,510
           Q 580,580 510,630
           C 460,550 440,400 450,270"
        fill="none"
        stroke="none"
      />
      {/* Path 3: Curvas por zona central */}
      <path
        id="cursor-path-3"
        d="M 330,450
           C 280,380 350,320 270,280
           Q 320,200 400,180
           C 480,200 520,350 450,420
           Q 400,500 390,570
           C 350,520 300,500 330,450"
        fill="none"
        stroke="none"
      />
      {/* Path 4: Curvas por zona superior-central */}
      <path
        id="cursor-path-4"
        d="M 360,120
           C 420,80 500,100 540,150
           Q 500,220 440,260
           C 380,240 340,200 320,160
           Q 340,130 360,120"
        fill="none"
        stroke="none"
      />
      {/* Path 5: Curvas por zona centro-izquierda */}
      <path
        id="cursor-path-5"
        d="M 120,300
           C 180,250 250,280 220,350
           Q 190,420 130,400
           C 80,380 90,330 120,300"
        fill="none"
        stroke="none"
      />

      {/* Cursor shape - flecha estilo Figma */}
      <defs>
        <path
          id="cursor-shape"
          d="M 0,0 L 0,16 L 4,12 L 7,18 L 9,17 L 6,11 L 11,11 Z"
          transform="scale(1.2)"
        />
      </defs>

      {/* Cursor 1 - Blanco (Kuma) */}
      <g>
        <use href="#cursor-shape" fill="#ffffff">
          <animateMotion dur="22s" repeatCount="indefinite">
            <mpath href="#cursor-path-1" />
          </animateMotion>
        </use>
        {/* Label */}
        <g>
          <animateMotion dur="22s" repeatCount="indefinite">
            <mpath href="#cursor-path-1" />
          </animateMotion>
          <rect x="0" y="22" width="75" height="16" rx="4" fill="#ffffff" />
          <text x="6" y="34" fill="#000000" fontSize="10" fontFamily="Inter, sans-serif" fontWeight="500">e-commerce</text>
        </g>
      </g>

      {/* Cursor 2 - Blanco (AI Agent) */}
      <g>
        <use href="#cursor-shape" fill="#ffffff">
          <animateMotion dur="22s" repeatCount="indefinite">
            <mpath href="#cursor-path-2" />
          </animateMotion>
        </use>
        {/* Label */}
        <g>
          <animateMotion dur="22s" repeatCount="indefinite">
            <mpath href="#cursor-path-2" />
          </animateMotion>
          <rect x="0" y="22" width="58" height="16" rx="4" fill="#ffffff" />
          <text x="6" y="34" fill="#000000" fontSize="10" fontFamily="Inter, sans-serif" fontWeight="500">IA Agent</text>
        </g>
      </g>

      {/* Cursor 3 - Blanco (Edinson) */}
      <g>
        <use href="#cursor-shape" fill="#ffffff">
          <animateMotion dur="22s" repeatCount="indefinite">
            <mpath href="#cursor-path-3" />
          </animateMotion>
        </use>
        {/* Label */}
        <g>
          <animateMotion dur="22s" repeatCount="indefinite">
            <mpath href="#cursor-path-3" />
          </animateMotion>
          <rect x="0" y="22" width="65" height="16" rx="4" fill="#ffffff" />
          <text x="6" y="34" fill="#000000" fontSize="10" fontFamily="Inter, sans-serif" fontWeight="500">The Bridge</text>
        </g>
      </g>

      {/* Cursor 4 - Blanco (you) */}
      <g>
        <use href="#cursor-shape" fill="#ffffff">
          <animateMotion dur="22s" repeatCount="indefinite">
            <mpath href="#cursor-path-4" />
          </animateMotion>
        </use>
        {/* Label */}
        <g>
          <animateMotion dur="22s" repeatCount="indefinite">
            <mpath href="#cursor-path-4" />
          </animateMotion>
          <rect x="0" y="22" width="26" height="16" rx="4" fill="#ffffff" />
          <text x="6" y="34" fill="#000000" fontSize="10" fontFamily="Inter, sans-serif" fontWeight="500">Tú</text>
        </g>
      </g>

      {/* Cursor 5 - Blanco (e-commerce 2) */}
      <g>
        <use href="#cursor-shape" fill="#ffffff">
          <animateMotion dur="22s" repeatCount="indefinite">
            <mpath href="#cursor-path-5" />
          </animateMotion>
        </use>
        {/* Label */}
        <g>
          <animateMotion dur="22s" repeatCount="indefinite">
            <mpath href="#cursor-path-5" />
          </animateMotion>
          <rect x="0" y="22" width="75" height="16" rx="4" fill="#ffffff" />
          <text x="6" y="34" fill="#000000" fontSize="10" fontFamily="Inter, sans-serif" fontWeight="500">e-commerce</text>
        </g>
      </g>
    </svg>
  );
}
