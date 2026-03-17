import { motion } from 'framer-motion';

interface PetProps {
  type: 'red-panda' | 'cat' | 'hamster' | 'frog';
  mood: string;
  size?: number;
  onClick?: () => void;
}

const moodToExpression = (mood: string) => {
  switch (mood) {
    case 'ecstatic': return { eyes: 'sparkle', mouth: 'big-smile', blush: true, bouncy: true };
    case 'happy': return { eyes: 'open', mouth: 'smile', blush: true, bouncy: false };
    case 'content': return { eyes: 'soft', mouth: 'small-smile', blush: false, bouncy: false };
    case 'meh': return { eyes: 'flat', mouth: 'flat', blush: false, bouncy: false };
    case 'sad': return { eyes: 'droopy', mouth: 'frown', blush: false, bouncy: false };
    case 'sick': return { eyes: 'dizzy', mouth: 'wavy', blush: false, bouncy: false };
    case 'starving': return { eyes: 'pleading', mouth: 'frown', blush: false, bouncy: false };
    case 'sleeping': return { eyes: 'closed', mouth: 'peaceful', blush: true, bouncy: false };
    default: return { eyes: 'open', mouth: 'smile', blush: false, bouncy: false };
  }
};

function Eyes({ type, expression }: { type: string; expression: string }) {
  const eyeSpacing = type === 'frog' ? 28 : type === 'hamster' ? 20 : 22;
  const eyeY = type === 'frog' ? 72 : type === 'hamster' ? 80 : 78;
  const eyeSize = type === 'frog' ? 12 : type === 'hamster' ? 8 : 9;

  switch (expression) {
    case 'sparkle':
      return (
        <g>
          <circle cx={100 - eyeSpacing} cy={eyeY} r={eyeSize} fill="#3D405B" />
          <circle cx={100 + eyeSpacing} cy={eyeY} r={eyeSize} fill="#3D405B" />
          <circle cx={100 - eyeSpacing + 3} cy={eyeY - 3} r={3} fill="white" />
          <circle cx={100 + eyeSpacing + 3} cy={eyeY - 3} r={3} fill="white" />
          <circle cx={100 - eyeSpacing - 2} cy={eyeY + 2} r={1.5} fill="white" />
          <circle cx={100 + eyeSpacing - 2} cy={eyeY + 2} r={1.5} fill="white" />
          {/* Star sparkles */}
          <motion.text x={100 - eyeSpacing - 14} y={eyeY - 10} fontSize="10" fill="#F2CC8F"
            animate={{ opacity: [1, 0.3, 1], scale: [1, 0.8, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>✦</motion.text>
          <motion.text x={100 + eyeSpacing + 8} y={eyeY - 8} fontSize="8" fill="#F2CC8F"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }} transition={{ duration: 1.5, repeat: Infinity }}>✦</motion.text>
        </g>
      );
    case 'open':
      return (
        <g>
          <circle cx={100 - eyeSpacing} cy={eyeY} r={eyeSize} fill="#3D405B" />
          <circle cx={100 + eyeSpacing} cy={eyeY} r={eyeSize} fill="#3D405B" />
          <circle cx={100 - eyeSpacing + 2.5} cy={eyeY - 2.5} r={2.5} fill="white" />
          <circle cx={100 + eyeSpacing + 2.5} cy={eyeY - 2.5} r={2.5} fill="white" />
        </g>
      );
    case 'soft':
      return (
        <g>
          <ellipse cx={100 - eyeSpacing} cy={eyeY} rx={eyeSize} ry={eyeSize * 0.7} fill="#3D405B" />
          <ellipse cx={100 + eyeSpacing} cy={eyeY} rx={eyeSize} ry={eyeSize * 0.7} fill="#3D405B" />
          <circle cx={100 - eyeSpacing + 2} cy={eyeY - 1.5} r={2} fill="white" />
          <circle cx={100 + eyeSpacing + 2} cy={eyeY - 1.5} r={2} fill="white" />
        </g>
      );
    case 'flat':
      return (
        <g>
          <line x1={100 - eyeSpacing - eyeSize} y1={eyeY} x2={100 - eyeSpacing + eyeSize} y2={eyeY} stroke="#3D405B" strokeWidth="3" strokeLinecap="round" />
          <line x1={100 + eyeSpacing - eyeSize} y1={eyeY} x2={100 + eyeSpacing + eyeSize} y2={eyeY} stroke="#3D405B" strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case 'droopy':
      return (
        <g>
          <ellipse cx={100 - eyeSpacing} cy={eyeY + 2} rx={eyeSize} ry={eyeSize * 0.6} fill="#3D405B" />
          <ellipse cx={100 + eyeSpacing} cy={eyeY + 2} rx={eyeSize} ry={eyeSize * 0.6} fill="#3D405B" />
          <line x1={100 - eyeSpacing - eyeSize} y1={eyeY - 6} x2={100 - eyeSpacing + eyeSize} y2={eyeY - 3} stroke="#3D405B" strokeWidth="2" strokeLinecap="round" />
          <line x1={100 + eyeSpacing + eyeSize} y1={eyeY - 6} x2={100 + eyeSpacing - eyeSize} y2={eyeY - 3} stroke="#3D405B" strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case 'dizzy':
      return (
        <g>
          <motion.g animate={{ rotate: [0, 360] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: `${100 - eyeSpacing}px ${eyeY}px` }}>
            <text x={100 - eyeSpacing - 6} y={eyeY + 5} fontSize="16" fill="#81B29A">@</text>
          </motion.g>
          <motion.g animate={{ rotate: [360, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: `${100 + eyeSpacing}px ${eyeY}px` }}>
            <text x={100 + eyeSpacing - 6} y={eyeY + 5} fontSize="16" fill="#81B29A">@</text>
          </motion.g>
        </g>
      );
    case 'pleading':
      return (
        <g>
          <circle cx={100 - eyeSpacing} cy={eyeY} r={eyeSize * 1.3} fill="#3D405B" />
          <circle cx={100 + eyeSpacing} cy={eyeY} r={eyeSize * 1.3} fill="#3D405B" />
          <circle cx={100 - eyeSpacing + 3} cy={eyeY - 3} r={4} fill="white" />
          <circle cx={100 + eyeSpacing + 3} cy={eyeY - 3} r={4} fill="white" />
          <circle cx={100 - eyeSpacing - 1} cy={eyeY + 2} r={2} fill="white" />
          <circle cx={100 + eyeSpacing - 1} cy={eyeY + 2} r={2} fill="white" />
          {/* Tears */}
          <motion.ellipse cx={100 - eyeSpacing - eyeSize} cy={eyeY + eyeSize + 4} rx={2} ry={3} fill="#A8B5C8" opacity={0.6}
            animate={{ y: [0, 8], opacity: [0.6, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
        </g>
      );
    case 'closed':
      return (
        <g>
          <path d={`M${100 - eyeSpacing - eyeSize} ${eyeY} Q${100 - eyeSpacing} ${eyeY + 6} ${100 - eyeSpacing + eyeSize} ${eyeY}`}
            stroke="#3D405B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d={`M${100 + eyeSpacing - eyeSize} ${eyeY} Q${100 + eyeSpacing} ${eyeY + 6} ${100 + eyeSpacing + eyeSize} ${eyeY}`}
            stroke="#3D405B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </g>
      );
    default:
      return (
        <g>
          <circle cx={100 - eyeSpacing} cy={eyeY} r={eyeSize} fill="#3D405B" />
          <circle cx={100 + eyeSpacing} cy={eyeY} r={eyeSize} fill="#3D405B" />
        </g>
      );
  }
}

function Mouth({ expression }: { expression: string }) {
  const y = 95;
  switch (expression) {
    case 'big-smile':
      return <path d="M88 93 Q100 108 112 93" stroke="#3D405B" strokeWidth="2.5" fill="none" strokeLinecap="round" />;
    case 'smile':
      return <path d="M90 94 Q100 103 110 94" stroke="#3D405B" strokeWidth="2.5" fill="none" strokeLinecap="round" />;
    case 'small-smile':
      return <path d="M93 95 Q100 100 107 95" stroke="#3D405B" strokeWidth="2" fill="none" strokeLinecap="round" />;
    case 'flat':
      return <line x1="93" y1={y} x2="107" y2={y} stroke="#3D405B" strokeWidth="2" strokeLinecap="round" />;
    case 'frown':
      return <path d="M92 98 Q100 92 108 98" stroke="#3D405B" strokeWidth="2.5" fill="none" strokeLinecap="round" />;
    case 'wavy':
      return <path d="M88 96 Q94 92 100 96 Q106 100 112 96" stroke="#81B29A" strokeWidth="2" fill="none" strokeLinecap="round" />;
    case 'peaceful':
      return <path d="M94 95 Q100 99 106 95" stroke="#3D405B" strokeWidth="2" fill="none" strokeLinecap="round" />;
    default:
      return <path d="M93 95 Q100 100 107 95" stroke="#3D405B" strokeWidth="2" fill="none" strokeLinecap="round" />;
  }
}

function Blush({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <g opacity={0.4}>
      <ellipse cx={72} cy={90} rx={8} ry={5} fill="#FFB4A2" />
      <ellipse cx={128} cy={90} rx={8} ry={5} fill="#FFB4A2" />
    </g>
  );
}

function RedPandaBody({ mood }: { mood: string }) {
  return (
    <g>
      {/* Tail */}
      <motion.g
        animate={mood === 'ecstatic' || mood === 'happy'
          ? { rotate: [-8, 8, -8] }
          : mood === 'sad' || mood === 'starving' ? { rotate: [5] } : { rotate: [-3, 3, -3] }}
        transition={{ duration: mood === 'ecstatic' ? 0.4 : 1.5, repeat: Infinity }}
        style={{ transformOrigin: '140px 120px' }}
      >
        <ellipse cx={155} cy={115} rx={22} ry={12} fill="#E07A5F" transform="rotate(-20 155 115)" />
        <ellipse cx={168} cy={108} rx={14} ry={8} fill="#F2CC8F" transform="rotate(-20 168 108)" />
        <ellipse cx={148} cy={118} rx={6} ry={3} fill="#3D405B" transform="rotate(-20 148 118)" />
        <ellipse cx={160} cy={112} rx={6} ry={3} fill="#3D405B" transform="rotate(-20 160 112)" />
      </motion.g>
      {/* Body */}
      <ellipse cx={100} cy={120} rx={40} ry={35} fill="#E07A5F" />
      <ellipse cx={100} cy={125} rx={30} ry={25} fill="#F2CC8F" />
      {/* Head */}
      <circle cx={100} cy={75} r={35} fill="#E07A5F" />
      {/* Face patch */}
      <ellipse cx={100} cy={82} rx={25} ry={22} fill="#FFF8F0" />
      {/* Ears */}
      <circle cx={72} cy={50} r={12} fill="#E07A5F" />
      <circle cx={128} cy={50} r={12} fill="#E07A5F" />
      <circle cx={72} cy={50} r={7} fill="#3D405B" />
      <circle cx={128} cy={50} r={7} fill="#3D405B" />
      {/* Eye markings */}
      <ellipse cx={80} cy={74} rx={12} ry={10} fill="#3D405B" opacity={0.3} />
      <ellipse cx={120} cy={74} rx={12} ry={10} fill="#3D405B" opacity={0.3} />
      {/* Nose */}
      <ellipse cx={100} cy={87} rx={4} ry={3} fill="#3D405B" />
      {/* Paws */}
      <ellipse cx={75} cy={148} rx={12} ry={8} fill="#3D405B" />
      <ellipse cx={125} cy={148} rx={12} ry={8} fill="#3D405B" />
    </g>
  );
}

function CatBody({ mood }: { mood: string }) {
  return (
    <g>
      {/* Tail */}
      <motion.path
        d="M140 120 Q165 100 170 80 Q172 70 168 75"
        stroke="#6B6E8A" strokeWidth="8" fill="none" strokeLinecap="round"
        animate={mood === 'ecstatic' || mood === 'happy'
          ? { d: ["M140 120 Q165 100 170 80 Q172 70 168 75", "M140 120 Q160 95 172 85 Q178 78 174 82", "M140 120 Q165 100 170 80 Q172 70 168 75"] }
          : {}}
        transition={{ duration: 0.8, repeat: Infinity }}
      />
      {/* Body */}
      <ellipse cx={100} cy={122} rx={36} ry={32} fill="#6B6E8A" />
      <ellipse cx={100} cy={127} rx={26} ry={22} fill="#D4D0E0" />
      {/* Head */}
      <circle cx={100} cy={75} r={32} fill="#6B6E8A" />
      {/* Inner face */}
      <ellipse cx={100} cy={80} rx={22} ry={20} fill="#D4D0E0" />
      {/* Ears - triangular */}
      <polygon points="72,55 60,30 84,48" fill="#6B6E8A" />
      <polygon points="128,55 140,30 116,48" fill="#6B6E8A" />
      <polygon points="74,52 65,36 82,48" fill="#FFB4A2" />
      <polygon points="126,52 135,36 118,48" fill="#FFB4A2" />
      {/* Nose */}
      <path d="M97 86 L100 89 L103 86" fill="#FFB4A2" />
      {/* Whiskers */}
      <line x1="60" y1="86" x2="82" y2="88" stroke="#6B6E8A" strokeWidth="1" opacity={0.5} />
      <line x1="58" y1="92" x2="80" y2="91" stroke="#6B6E8A" strokeWidth="1" opacity={0.5} />
      <line x1="118" y1="88" x2="140" y2="86" stroke="#6B6E8A" strokeWidth="1" opacity={0.5} />
      <line x1="120" y1="91" x2="142" y2="92" stroke="#6B6E8A" strokeWidth="1" opacity={0.5} />
      {/* Paws */}
      <ellipse cx={78} cy={148} rx={10} ry={7} fill="#6B6E8A" />
      <ellipse cx={122} cy={148} rx={10} ry={7} fill="#6B6E8A" />
    </g>
  );
}

function HamsterBody({ mood }: { mood: string }) {
  return (
    <g>
      {/* Body - very round */}
      <ellipse cx={100} cy={110} rx={42} ry={45} fill="#F2CC8F" />
      <ellipse cx={100} cy={118} rx={34} ry={32} fill="#FFF8F0" />
      {/* Head - merged with body, hamsters are round */}
      <circle cx={100} cy={78} r={34} fill="#F2CC8F" />
      {/* Cheeks - the cute part */}
      <motion.ellipse cx={72} cy={88} rx={16} ry={12} fill="#FFE0CC"
        animate={mood === 'ecstatic' || mood === 'happy'
          ? { rx: [16, 18, 16] } : {}}
        transition={{ duration: 0.5, repeat: Infinity }}
      />
      <motion.ellipse cx={128} cy={88} rx={16} ry={12} fill="#FFE0CC"
        animate={mood === 'ecstatic' || mood === 'happy'
          ? { rx: [16, 18, 16] } : {}}
        transition={{ duration: 0.5, repeat: Infinity }}
      />
      {/* Ears */}
      <circle cx={74} cy={52} r={10} fill="#F2CC8F" />
      <circle cx={126} cy={52} r={10} fill="#F2CC8F" />
      <circle cx={74} cy={52} r={6} fill="#FFB4A2" />
      <circle cx={126} cy={52} r={6} fill="#FFB4A2" />
      {/* Nose */}
      <circle cx={100} cy={88} r={3.5} fill="#FFB4A2" />
      {/* Tiny paws */}
      <ellipse cx={78} cy={148} rx={8} ry={6} fill="#E8C280" />
      <ellipse cx={122} cy={148} rx={8} ry={6} fill="#E8C280" />
      {/* Belly line */}
      <path d="M88 130 Q100 140 112 130" stroke="#E8C280" strokeWidth="1.5" fill="none" opacity={0.4} />
    </g>
  );
}

function FrogBody({ mood }: { mood: string }) {
  return (
    <g>
      {/* Body */}
      <ellipse cx={100} cy={118} rx={38} ry={36} fill="#81B29A" />
      <ellipse cx={100} cy={124} rx={30} ry={26} fill="#A8D5BA" />
      {/* Head - wider */}
      <ellipse cx={100} cy={78} rx={38} ry={30} fill="#81B29A" />
      {/* Eye bumps - signature frog look */}
      <circle cx={76} cy={58} r={16} fill="#81B29A" />
      <circle cx={124} cy={58} r={16} fill="#81B29A" />
      <circle cx={76} cy={58} r={12} fill="#A8D5BA" />
      <circle cx={124} cy={58} r={12} fill="#A8D5BA" />
      {/* Mouth line */}
      <path d="M68 92 Q100 98 132 92" stroke="#3D405B" strokeWidth="1.5" fill="none" opacity={0.3} />
      {/* Spots */}
      <circle cx={130} cy={100} r={4} fill="#6B9E84" opacity={0.3} />
      <circle cx={70} cy={105} r={3} fill="#6B9E84" opacity={0.3} />
      <circle cx={115} cy={135} r={3.5} fill="#6B9E84" opacity={0.3} />
      {/* Front legs */}
      <motion.g
        animate={mood === 'ecstatic' ? { y: [0, -5, 0] } : {}}
        transition={{ duration: 0.6, repeat: Infinity }}
      >
        <ellipse cx={70} cy={148} rx={12} ry={6} fill="#81B29A" />
        <ellipse cx={130} cy={148} rx={12} ry={6} fill="#81B29A" />
        {/* Toes */}
        <circle cx={62} cy={148} r={3} fill="#6B9E84" />
        <circle cx={70} cy={150} r={3} fill="#6B9E84" />
        <circle cx={78} cy={148} r={3} fill="#6B9E84" />
        <circle cx={122} cy={148} r={3} fill="#6B9E84" />
        <circle cx={130} cy={150} r={3} fill="#6B9E84" />
        <circle cx={138} cy={148} r={3} fill="#6B9E84" />
      </motion.g>
    </g>
  );
}

function SickEffect() {
  return (
    <motion.g animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 2, repeat: Infinity }}>
      <text x="130" y="60" fontSize="14" fill="#81B29A">~</text>
      <text x="140" y="52" fontSize="12" fill="#81B29A">~</text>
      <text x="135" y="44" fontSize="10" fill="#81B29A">~</text>
    </motion.g>
  );
}

function SleepEffect() {
  return (
    <g>
      <motion.text x="130" y="55" fontSize="16" fill="#A8B5C8" fontWeight="bold"
        animate={{ y: [55, 45], opacity: [1, 0] }} transition={{ duration: 2, repeat: Infinity }}>z</motion.text>
      <motion.text x="140" y="45" fontSize="12" fill="#A8B5C8" fontWeight="bold"
        animate={{ y: [45, 35], opacity: [1, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}>z</motion.text>
      <motion.text x="148" y="38" fontSize="9" fill="#A8B5C8" fontWeight="bold"
        animate={{ y: [38, 28], opacity: [1, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 1.4 }}>z</motion.text>
    </g>
  );
}

export default function PetSVG({ type, mood, size = 200, onClick }: PetProps) {
  const expr = moodToExpression(mood);

  const BodyComponent = {
    'red-panda': RedPandaBody,
    'cat': CatBody,
    'hamster': HamsterBody,
    'frog': FrogBody,
  }[type];

  return (
    <motion.svg
      viewBox="0 0 200 160"
      width={size}
      height={size * 0.8}
      onClick={onClick}
      className="cursor-pointer select-none"
      animate={expr.bouncy
        ? { y: [0, -6, 0] }
        : { scale: [1, 1.02, 1] }}
      transition={expr.bouncy
        ? { duration: 0.5, repeat: Infinity, ease: 'easeInOut' }
        : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      whileTap={{ scale: 0.92 }}
    >
      <BodyComponent mood={mood} />
      <Eyes type={type} expression={expr.eyes} />
      <Mouth expression={expr.mouth} />
      <Blush show={expr.blush} />
      {mood === 'sick' && <SickEffect />}
      {mood === 'sleeping' && <SleepEffect />}
    </motion.svg>
  );
}
