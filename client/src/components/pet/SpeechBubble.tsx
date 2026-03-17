import { motion, AnimatePresence } from 'framer-motion';

const dialogue: Record<string, string[]> = {
  ecstatic: [
    "I feel AMAZING!! 🌟",
    "We're unstoppable!",
    "Best day ever!",
    "I'm so full of energy!",
    "You're doing great!",
  ],
  happy: [
    "Feeling good today~",
    "Thanks for taking care of me!",
    "Keep it up!",
    "I love this!",
    "What a nice day!",
  ],
  content: [
    "Doing alright!",
    "Pretty cozy~",
    "Not bad, not bad.",
    "I'm comfortable!",
    "Things are good.",
  ],
  meh: [
    "Hmm...",
    "Could be better...",
    "I'm a bit bored.",
    "Maybe some food?",
    "Let's do something!",
  ],
  sad: [
    "I miss you...",
    "I'm not feeling great...",
    "Please feed me...",
    "Can we go for a walk?",
    "I need some attention...",
  ],
  sick: [
    "Urgh... too much...",
    "My tummy hurts...",
    "I need a break...",
    "Maybe less next time...",
    "Oof...",
  ],
  starving: [
    "I'm SO hungry...",
    "Please feed me!",
    "My tummy is rumbling...",
    "Food... food...",
    "I can't go on...",
  ],
  sleeping: [
    "zzz...",
    "*snore*",
    "mmm... treats...",
    "*peaceful breathing*",
    "zzz... zzz...",
  ],
  food_reaction: [
    "Yummy! Thank you!",
    "Mmm that was good!",
    "Delicious!",
    "*munch munch*",
    "More please!",
  ],
  exercise_reaction: [
    "Great workout!",
    "I feel stronger!",
    "Phew, that was fun!",
    "Let's go again!",
    "Exercise is fun!",
  ],
  pet_reaction: [
    "Hehe that tickles!",
    "I love pets!",
    "*purrs*",
    "So nice~",
    "More please!",
  ],
  treat_reaction: [
    "A treat?! For me?!",
    "Yay, my favorite!",
    "Nom nom nom!",
    "You spoil me!",
    "Best treat ever!",
  ],
};

const seasonalDialogue: Record<string, string[]> = {
  spring: ["The flowers are so pretty!", "Spring vibes!", "Everything's blooming!"],
  summer: ["It's so warm!", "Perfect day to be outside!", "Summer energy!"],
  fall: ["The leaves are so colorful!", "Cozy season!", "I love sweater weather!"],
  winter: ["Brr, it's chilly!", "Stay warm out there!", "Hot cocoa weather!"],
};

function getSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

function pickRandom(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface SpeechBubbleProps {
  mood: string;
  reaction?: { type: 'food' | 'exercise' | 'pet' | 'treat'; mood: string } | null;
  isStuffed?: boolean;
  isExhausted?: boolean;
}

const stuffedDialogue = [
  "So full... need to digest...",
  "No more food for now please!",
  "My belly is so round...",
  "*lies down* Too much food...",
  "I ate too much, but I'll be fine!",
];

const exhaustedDialogue = [
  "Need to catch my breath...",
  "So tired from working out...",
  "Let me rest for a bit...",
  "*panting* That was intense!",
  "I pushed too hard today!",
];

export default function SpeechBubble({ mood, reaction, isStuffed, isExhausted }: SpeechBubbleProps) {
  const text = reaction
    ? pickRandom(dialogue[`${reaction.type}_reaction`] || dialogue.content)
    : isStuffed && isExhausted
    ? pickRandom(dialogue.sick)
    : isStuffed
    ? pickRandom(stuffedDialogue)
    : isExhausted
    ? pickRandom(exhaustedDialogue)
    : Math.random() < 0.15
    ? pickRandom(seasonalDialogue[getSeason()])
    : pickRandom(dialogue[mood] || dialogue.content);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={text}
        initial={{ opacity: 0, y: 10, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.8 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="font-pet text-lg text-brown bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-sm relative inline-block"
      >
        {text}
        {/* Bubble tail */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white/80" />
      </motion.div>
    </AnimatePresence>
  );
}
