export const STRETCH_CATEGORIES = [
  { id: 'all', label: 'All Routines', icon: 'apps' },
  { id: 'neck', label: 'Neck & Shoulders', icon: 'self_improvement' },
  { id: 'back', label: 'Spine & Back', icon: 'fitness_center' },
  { id: 'wrists', label: 'Hands & Wrists', icon: 'pan_tool' },
  { id: 'legs', label: 'Hips & Legs', icon: 'directions_walk' },
  { id: 'eyes', label: 'Eye Strain Relief', icon: 'visibility' },
  { id: 'breathing', label: 'Mindful Breathing', icon: 'air' }
];

export const STRETCHES = [
  {
    id: 'neck-tilt',
    title: 'Gentle Neck Release',
    category: 'neck',
    duration: 30,
    difficulty: 'Easy',
    target: 'Cervical Spine & Upper Traps',
    icon: 'accessibility_new',
    instructions: [
      'Sit tall with your shoulders relaxed away from your ears.',
      'Slowly drop your right ear toward your right shoulder.',
      'Place your right hand gently on the left side of your head for light assistance (do not force).',
      'Hold for 15 seconds, deep breathing, then repeat on the left side.'
    ],
    tips: 'Keep your chest open and avoid hunching forward.'
  },
  {
    id: 'shoulder-rolls',
    title: 'Shoulder Blade Rolls',
    category: 'neck',
    duration: 30,
    difficulty: 'Easy',
    target: 'Trapezius & Rhomboids',
    icon: 'hdr_auto',
    instructions: [
      'Inhale deeply and shrug your shoulders up toward your ears.',
      'Roll them backward in a smooth circular motion.',
      'Squeeze shoulder blades together as you lower them down.',
      'Perform 10 rolls backward, then 10 rolls forward.'
    ],
    tips: 'Focus on smooth, full circular motions to relieve upper back tension.'
  },
  {
    id: 'seated-twist',
    title: 'Seated Spinal Twist',
    category: 'back',
    duration: 45,
    difficulty: 'Easy',
    target: 'Thoracic & Lumbar Spine',
    icon: 'autorenew',
    instructions: [
      'Sit near the front edge of your chair with feet flat on the floor.',
      'Place your right hand on the outside of your left knee.',
      'Gently twist your torso to the left, looking over your left shoulder.',
      'Hold for 20 seconds, inhale to lengthen, exhale to deepen, then switch sides.'
    ],
    tips: 'Lengthen your spine upward before twisting; never strain.'
  },
  {
    id: 'wrist-extension',
    title: 'Wrist & Forearm Extension',
    category: 'wrists',
    duration: 30,
    difficulty: 'Easy',
    target: 'Wrist Flexors & Forearm Tendons',
    icon: 'pan_tool',
    instructions: [
      'Extend your right arm forward with palm facing away and fingers pointing up.',
      'Use your left hand to gently pull your right fingers back toward your body.',
      'Hold for 15 seconds, feeling a gentle stretch in the underside of your arm.',
      'Point fingers down and pull gently backward for 15 seconds, then switch arms.'
    ],
    tips: 'Essential for keyboard and mouse users to prevent repetitive strain.'
  },
  {
    id: 'hip-opener',
    title: 'Seated Figure-4 Stretch',
    category: 'legs',
    duration: 45,
    difficulty: 'Medium',
    target: 'Piriformis & Gluteal Muscles',
    icon: 'airline_seat_recline_extra',
    instructions: [
      'Cross your right ankle over your left knee, forming a "4" shape.',
      'Flex your right foot to protect your knee joint.',
      'Keep your back straight and hinge forward at your hips until you feel a stretch in your outer hip.',
      'Hold for 20 seconds, breathe steadily, then switch legs.'
    ],
    tips: 'Avoid rounding your lower back; hinge cleanly from the hips.'
  },
  {
    id: 'eye-20-20-20',
    title: '20-20-20 Eye Rest',
    category: 'eyes',
    duration: 30,
    difficulty: 'Gentle',
    target: 'Ciliary Muscles & Visual Focus',
    icon: 'visibility',
    instructions: [
      'Look away from your screen and computer monitors.',
      'Find an object at least 20 feet (6 meters) away.',
      'Gently blink several times to rehydrate your eyes.',
      'Focus softly on that distant object for 20 continuous seconds.'
    ],
    tips: 'Reduces digital eye fatigue and headaches from screen glare.'
  },
  {
    id: 'box-breathing',
    title: 'Reset Box Breathing',
    category: 'breathing',
    duration: 60,
    difficulty: 'Gentle',
    target: 'Parasympathetic Nervous System',
    icon: 'air',
    instructions: [
      'Inhale slowly through your nose for 4 seconds.',
      'Hold your breath comfortably for 4 seconds.',
      'Exhale smoothly through your mouth for 4 seconds.',
      'Hold empty for 4 seconds. Repeat for 3 full cycles.'
    ],
    tips: 'Calms mind chatter and lowers cortisol during intense work hours.'
  }
];

export function getStretchesByCategory(category = 'all') {
  if (category === 'all') return STRETCHES;
  return STRETCHES.filter((s) => s.category === category);
}

export function getRandomQuickRoutine(count = 3) {
  const shuffled = [...STRETCHES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
