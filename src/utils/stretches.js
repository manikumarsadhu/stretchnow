import neckVideo from '../media/neck excercise video.mp4';

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
    videoUrl: neckVideo,
    appwriteStorageFileId: '6a6af236001a9cd9ec67',
    hasVideo: true,
    difficulty: 'Easy',
    target: 'Cervical Spine & Upper Traps',
    icon: 'accessibility_new',
    targetMuscles: 'Cervical Spine, Upper Trapezius, Scalenes',
    benefits: 'Relieves compression in neck joints, reduces tension from forward-head postures.',
    commonMistakes: 'Pulling your head down too forcefully, letting shoulders lift towards the ears.',
    safetyPrecautions: 'Do not press hard on the head. Keep movement slow and controlled.',
    level: 'Beginner',
    estimatedCalories: 1.0,
    officeFriendly: true,
    equipmentRequired: 'None',
    sittingStanding: 'Sitting',
    bodyRegion: 'Neck',
    searchKeywords: ['neck', 'headache', 'shoulders', 'tension', 'traps'],
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
    targetMuscles: 'Trapezius, Rhomboids, Levator Scapulae',
    benefits: 'Increases blood flow to upper back, releases locked shoulder joints.',
    commonMistakes: 'Rolling too fast or doing partial movements instead of full circles.',
    safetyPrecautions: 'Avoid rolling forward if you suffer from severe rounded-shoulders; prioritize backward rolls.',
    level: 'Beginner',
    estimatedCalories: 1.5,
    officeFriendly: true,
    equipmentRequired: 'None',
    sittingStanding: 'Sitting',
    bodyRegion: 'Neck',
    searchKeywords: ['shoulders', 'shrugs', 'scapula', 'upper back'],
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
    targetMuscles: 'Erector Spinae, Obliques, Thoracic Spine',
    benefits: 'Improves spinal rotation flexibility, aids digestion and abdominal circulation.',
    commonMistakes: 'Forcing the twist with your hands beyond your spine\'s natural limit.',
    safetyPrecautions: 'Do not twist if you have a recent disc herniation or severe back pain.',
    level: 'Intermediate',
    estimatedCalories: 2.0,
    officeFriendly: true,
    equipmentRequired: 'None',
    sittingStanding: 'Sitting',
    bodyRegion: 'Back',
    searchKeywords: ['back', 'spine', 'waist', 'rotation', 'lower back'],
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
    targetMuscles: 'Wrist Flexors, Pronator Teres, Brachioradialis',
    benefits: 'Relieves strain in forearm flexor tendons caused by typing and mouse usage.',
    commonMistakes: 'Locking your elbow completely if you have hyperextension tendencies.',
    safetyPrecautions: 'If you feel sharp neural tingling (carpal tunnel symptom), reduce stretching angle.',
    level: 'Beginner',
    estimatedCalories: 0.8,
    officeFriendly: true,
    equipmentRequired: 'None',
    sittingStanding: 'Sitting',
    bodyRegion: 'Wrists',
    searchKeywords: ['wrist', 'typing', 'carpal tunnel', 'hand', 'mouse'],
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
    targetMuscles: 'Piriformis, Gluteus Medius, Hip Rotators',
    benefits: 'Decompresses hip sockets, reduces sciatica issues and lower back stiffness.',
    commonMistakes: 'Rounding your lower back instead of keeping it straight and hinging forward.',
    safetyPrecautions: 'Be cautious if you have pre-existing knee injuries; do not push your knee downward.',
    level: 'Intermediate',
    estimatedCalories: 2.5,
    officeFriendly: true,
    equipmentRequired: 'None',
    sittingStanding: 'Sitting',
    bodyRegion: 'Legs',
    searchKeywords: ['hips', 'glutes', 'sciatica', 'legs', 'lower back'],
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
    targetMuscles: 'Ciliary Muscles, Extraocular Muscles',
    benefits: 'Resets focus muscles, increases blink rate to lubricate corneas.',
    commonMistakes: 'Looking at something nearby or straining your focus instead of soft viewing.',
    safetyPrecautions: 'Keep eyes relaxed and blink softly.',
    level: 'Beginner',
    estimatedCalories: 0.2,
    officeFriendly: true,
    equipmentRequired: 'None',
    sittingStanding: 'Sitting',
    bodyRegion: 'Eyes',
    searchKeywords: ['eyes', 'sight', 'headache', 'screen fatigue', 'focus'],
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
    targetMuscles: 'Diaphragm, Intercostals, Vagus Nerve',
    benefits: 'Calms nervous system, improves oxygen exchange, reduces anxiety.',
    commonMistakes: 'Holding breath until gasping; chest breathing instead of belly breathing.',
    safetyPrecautions: 'If you feel dizzy or lightheaded, stop the hold and return to normal breathing.',
    level: 'Beginner',
    estimatedCalories: 0.5,
    officeFriendly: true,
    equipmentRequired: 'None',
    sittingStanding: 'Sitting',
    bodyRegion: 'Breathing',
    searchKeywords: ['breathing', 'calm', 'anxiety', 'box breath', 'vagus'],
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
