import sdk from 'https://esm.sh/@farcaster/frame-sdk';

const questions = [
  {
    prompt: 'A 24-year-old has episodic wheezing that worsens at night. Spirometry improves after albuterol. Which mechanism best explains the rescue medication effect?',
    options: [
      'Beta-2 agonism increases cAMP and relaxes bronchial smooth muscle',
      'Muscarinic agonism increases mucus clearance',
      'Leukotriene receptor activation reduces airway edema',
      'Mast cell degranulation improves airflow'
    ],
    answer: 0,
    explanation: 'Albuterol is a short-acting beta-2 agonist. Beta-2 stimulation raises cAMP in airway smooth muscle, causing rapid bronchodilation. The clinical pattern is reversible obstructive disease with nocturnal symptoms.',
    wrong: 'Muscarinic agonism would worsen bronchoconstriction. Leukotriene blockade can help asthma control but is not the rapid rescue mechanism. Mast cell degranulation releases bronchoconstricting mediators.'
  },
  {
    prompt: 'A patient with fever, neck stiffness, and petechial rash has gram-negative diplococci in CSF. What virulence factor drives the shock risk?',
    options: [
      'Endotoxin from lipooligosaccharide',
      'Exotoxin A inhibition of EF-2',
      'IgA protease-mediated hemolysis',
      'M protein cross-reactivity'
    ],
    answer: 0,
    explanation: 'Neisseria meningitidis has lipooligosaccharide endotoxin, which triggers cytokine release, capillary leak, DIC, and septic shock. Petechiae plus meningitis is the key pattern.',
    wrong: 'Exotoxin A is linked to Pseudomonas. IgA protease helps mucosal colonization but does not explain shock. M protein is a Streptococcus pyogenes virulence factor.'
  },
  {
    prompt: 'A diabetic patient has burning foot pain and reduced vibration sense. Which pathophysiologic process is most responsible?',
    options: [
      'Distal symmetric axonal degeneration from chronic hyperglycemia',
      'Autoimmune demyelination of peripheral nerves',
      'Dopamine depletion in the substantia nigra',
      'Anterior horn cell destruction'
    ],
    answer: 0,
    explanation: 'Diabetic neuropathy is typically distal symmetric polyneuropathy. Chronic hyperglycemia causes metabolic and microvascular injury, producing length-dependent axonal damage.',
    wrong: 'Autoimmune demyelination suggests Guillain-Barre or CIDP. Dopamine depletion causes parkinsonism. Anterior horn cell loss causes motor neuron disease patterns, not stocking sensory loss.'
  }
];

const state = {
  index: 0,
  score: Number(localStorage.getItem('medflashScore') || 0),
  streak: Number(localStorage.getItem('medflashStreak') || 0),
  answered: false,
  timerId: null,
  seconds: 30
};

const questionText = document.querySelector('#questionText');
const optionsEl = document.querySelector('#options');
const explanationBox = document.querySelector('#explanationBox');
const resultLabel = document.querySelector('#resultLabel');
const explanationText = document.querySelector('#explanationText');
const whyWrong = document.querySelector('#whyWrong');
const nextBtn = document.querySelector('#nextBtn');
const shareBtn = document.querySelector('#shareBtn');
const scoreCount = document.querySelector('#scoreCount');
const streakCount = document.querySelector('#streakCount');
const questionCount = document.querySelector('#questionCount');
const timer = document.querySelector('#timer');

function saveProgress() {
  localStorage.setItem('medflashScore', String(state.score));
  localStorage.setItem('medflashStreak', String(state.streak));
}

function updateStats() {
  scoreCount.textContent = state.score;
  streakCount.textContent = state.streak;
  questionCount.textContent = state.index + 1;
}

function startTimer() {
  clearInterval(state.timerId);
  state.seconds = 30;
  timer.textContent = '00:30';
  state.timerId = setInterval(() => {
    state.seconds -= 1;
    timer.textContent = `00:${String(Math.max(state.seconds, 0)).padStart(2, '0')}`;
    if (state.seconds <= 0) {
      clearInterval(state.timerId);
      if (!state.answered) selectAnswer(-1);
    }
  }, 1000);
}

function renderQuestion() {
  const question = questions[state.index % questions.length];
  state.answered = false;
  questionText.textContent = question.prompt;
  optionsEl.innerHTML = '';
  explanationBox.classList.add('hidden');

  question.options.forEach((option, optionIndex) => {
    const button = document.createElement('button');
    button.className = 'option-btn';
    button.type = 'button';
    button.textContent = option;
    button.addEventListener('click', () => selectAnswer(optionIndex), { passive: true });
    button.addEventListener('touchstart', () => button.classList.add('touching'), { passive: true });
    button.addEventListener('touchend', () => button.classList.remove('touching'), { passive: true });
    optionsEl.appendChild(button);
  });

  updateStats();
  startTimer();
}

function selectAnswer(selectedIndex) {
  if (state.answered) return;

  const question = questions[state.index % questions.length];
  const isCorrect = selectedIndex === question.answer;
  const buttons = [...document.querySelectorAll('.option-btn')];

  state.answered = true;
  clearInterval(state.timerId);

  buttons.forEach((button, buttonIndex) => {
    button.disabled = true;
    if (buttonIndex === question.answer) button.classList.add('correct');
    if (buttonIndex === selectedIndex && !isCorrect) button.classList.add('incorrect');
  });

  if (isCorrect) {
    state.score += 10;
    state.streak += 1;
    resultLabel.textContent = 'Correct +10 XP';
  } else {
    state.streak = 0;
    resultLabel.textContent = selectedIndex === -1 ? 'Time up' : 'Not quite';
  }

  explanationText.textContent = question.explanation;
  whyWrong.textContent = `Why the others are wrong: ${question.wrong}`;
  explanationBox.classList.remove('hidden');
  saveProgress();
  updateStats();
}

function nextQuestion() {
  state.index = (state.index + 1) % questions.length;
  renderQuestion();
}

async function shareResult() {
  const text = `I just scored ${state.score} XP on MedFlash with a ${state.streak}-day streak. One clinical question. One high-yield explanation.`;

  if (navigator.share) {
    await navigator.share({ title: 'MedFlash', text }).catch(() => {});
    return;
  }

  await navigator.clipboard.writeText(text).catch(() => {});
  shareBtn.textContent = 'Copied';
  setTimeout(() => {
    shareBtn.textContent = 'Share result';
  }, 1200);
}

nextBtn.addEventListener('click', nextQuestion);
shareBtn.addEventListener('click', shareResult);
document.addEventListener('gesturestart', event => event.preventDefault());

renderQuestion();
sdk.actions.ready();
