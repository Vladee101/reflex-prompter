import React, { useState, useEffect } from 'react';
import { 
	Play, RotateCcw, ChevronRight, ChevronLeft, Volume2, Settings, Plus, Trash2, ArrowUp, ArrowDown, Bookmark, FolderOpen, FilePlus
} from 'lucide-react';

// --- LOCAL STORAGE KEYS ---
const LESSONS_STORAGE_KEY = 'reflex_prompter_multi_lessons';
const CURRENT_LESSON_ID_KEY = 'reflex_current_lesson_id';

// --- DEFAULT DATA ---
const DEFAULT_LESSON_STEPS = []; 
const DEFAULT_LESSON_NAME = 'Untitled Lesson'; 

export default function App() {
	// Modes: 'home', 'running', 'editing'
	const [mode, setMode] = useState('home');
	
	// Lesson Data State
	const [lessonPlan, setLessonPlan] = useState(DEFAULT_LESSON_STEPS);
	const [lessonName, setLessonName] = useState(DEFAULT_LESSON_NAME);
	const [currentLessonId, setCurrentLessonId] = useState(null);
	
	// Storage State
	const [savedLessons, setSavedLessons] = useState([]);
	const [loadMessage, setLoadMessage] = useState(null);	
	
	// Running State
	const [currentIndex, setCurrentIndex] = useState(0);
	const [stock, setStock] = useState([]);
	
	// Fullscreen State
	const [isFullscreen, setIsFullscreen] = useState(false);

	// --- LOCAL STORAGE UTILITIES ---

	const getLessonsFromStorage = () => {
		const data = localStorage.getItem(LESSONS_STORAGE_KEY);
		return data ? JSON.parse(data) : [];
	};

	const saveLessonsToStorage = (lessons) => {
		localStorage.setItem(LESSONS_STORAGE_KEY, JSON.stringify(lessons));
	};
	
	// --- FULLSCREEN FUNCTION ---
	const toggleFullscreen = () => {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen()
				.then(() => setIsFullscreen(true))
				.catch(err => console.log('Fullscreen error:', err));
		} else {
			document.exitFullscreen()
				.then(() => setIsFullscreen(false))
				.catch(console.log);
		}
	};
	
	// --- EXPORT/IMPORT FUNCTIONS ---
	const exportLessons = () => {
		const lessons = getLessonsFromStorage();
		if (lessons.length === 0) {
			setLoadMessage('No lessons to export');
			setTimeout(() => setLoadMessage(null), 3000);
			return;
		}
		
		const dataStr = JSON.stringify(lessons, null, 2);
		const dataBlob = new Blob([dataStr], {type: 'application/json'});
		
		// Create download link
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `reflex_lessons_${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
		
		setLoadMessage(`Exported ${lessons.length} lesson(s)`);
		setTimeout(() => setLoadMessage(null), 3000);
	};

	const importLessons = () => {
		// Create file input element
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		
		input.onchange = (e) => {
			const file = e.target.files[0];
			if (!file) return;
			
			const reader = new FileReader();
			reader.onload = (event) => {
				try {
					const importedData = JSON.parse(event.target.result);
					
					// Basic validation
					if (!Array.isArray(importedData)) {
						throw new Error('Invalid file format: Expected array of lessons');
					}
					
					// Validate each lesson has basic structure
					const isValid = importedData.every(lesson => 
						lesson.id && lesson.name && Array.isArray(lesson.steps)
					);
					
					if (!isValid) {
						throw new Error('Invalid lesson structure');
					}
					
					// Merge with existing lessons (avoid duplicates by ID)
					const existingLessons = getLessonsFromStorage();
					const existingIds = new Set(existingLessons.map(l => l.id));
					
					const newLessons = importedData.filter(lesson => !existingIds.has(lesson.id));
					const updatedLessons = [...existingLessons, ...newLessons];
					
					// Save to storage
					saveLessonsToStorage(updatedLessons);
					setSavedLessons(updatedLessons);
					
					if (newLessons.length > 0) {
						setLoadMessage(`Imported ${newLessons.length} new lesson(s)`);
					} else {
						setLoadMessage('No new lessons imported (duplicates skipped)');
					}
					setTimeout(() => setLoadMessage(null), 3000);
					
				} catch (error) {
					setLoadMessage(`Import failed: ${error.message}`);
					setTimeout(() => setLoadMessage(null), 3000);
				}
			};
			reader.readAsText(file);
		};
		
		input.click();
	};

	// --- INITIAL LOAD & SYNC ---

	useEffect(() => {
		// 1. Load all saved lessons
		const storedLessons = getLessonsFromStorage();
		setSavedLessons(storedLessons);

		// 2. Determine which lesson to load as active (if any)
		const storedCurrentId = localStorage.getItem(CURRENT_LESSON_ID_KEY);
		
		let activeLesson = null;

		if (storedCurrentId) {
			activeLesson = storedLessons.find(l => l.id === storedCurrentId);
		}

		if (activeLesson) {
			setCurrentLessonId(activeLesson.id);
			setLessonName(activeLesson.name);
			setLessonPlan(activeLesson.steps.map(step => ({	
				id: step.id,	
				text: step.text,	
				type: step.type || "statement"	
			})));
		} else if (storedLessons.length > 0) {
			// If no stored ID, default to the first saved lesson
			activeLesson = storedLessons[0];
			setCurrentLessonId(activeLesson.id);
			setLessonName(activeLesson.name);
			setLessonPlan(activeLesson.steps.map(step => ({	
				id: step.id,	
				text: step.text,	
				type: step.type || "statement"	
			})));
		} else {
			// No saved lessons, stick with the new, empty default plan
			setCurrentLessonId(null);
			setLessonName(DEFAULT_LESSON_NAME);
			setLessonPlan(DEFAULT_LESSON_STEPS);
		}
	}, []);

	// 3. Persist the current active lesson ID whenever it changes
	useEffect(() => {
		if (currentLessonId) {
			localStorage.setItem(CURRENT_LESSON_ID_KEY, currentLessonId);
		} else {
			localStorage.removeItem(CURRENT_LESSON_ID_KEY);
		}
	}, [currentLessonId]);

	// Track fullscreen changes
	useEffect(() => {
		const handleFullscreenChange = () => {
			setIsFullscreen(!!document.fullscreenElement);
		};
		
		document.addEventListener('fullscreenchange', handleFullscreenChange);
		return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
	}, []);

	// --- LOCAL STORAGE CRUD OPERATIONS ---

	const saveCurrentLesson = (name) => {
		if (!name.trim()) return;

		// Save only necessary fields: id, name, and simplified steps
		const simplifiedSteps = lessonPlan.map(step => ({
			id: step.id,
			text: step.text,
			type: step.type || "statement", // Ensure type is saved
		}));

		const lessonData = {
			id: currentLessonId || crypto.randomUUID(), // Reuse existing ID or generate new one
			name: name.trim(),
			steps: simplifiedSteps,
			updatedAt: new Date().toISOString(),
		};

		const lessons = getLessonsFromStorage();
		
		// Check if lesson with this ID exists
		const existingIndex = lessons.findIndex(l => l.id === lessonData.id);

		if (existingIndex > -1) {
			// Update existing lesson
			lessons[existingIndex] = lessonData;
		} else {
			// Add new lesson
			lessons.push(lessonData);
		}
		
		saveLessonsToStorage(lessons);
		setSavedLessons(lessons); // Update state for UI list
		setCurrentLessonId(lessonData.id); // Set the ID of the newly saved or updated lesson
		setLessonName(lessonData.name);
		
		// Navigate back to the home screen after saving a new lesson
		setLoadMessage(`Lesson "${name.trim()}" saved locally!`);
		setMode('home'); 
		setTimeout(() => setLoadMessage(null), 3000);
	};

	const loadSavedLesson = (lesson) => {
		// Load the lesson from the saved data
		setLessonPlan(lesson.steps.map(step => ({	
			id: step.id,	
			text: step.text,	
			type: step.type || "statement"	
		})));
		setLessonName(lesson.name);
		setCurrentLessonId(lesson.id);
		setMode('home');	
		
		setLoadMessage(`Successfully loaded: "${lesson.name}"`);
		setTimeout(() => setLoadMessage(null), 3000);
	};

	const deleteSavedLesson = (id, name) => {
		// NOTE: In a real-world app, a custom modal UI must be used here instead of window.confirm.
		console.warn(`Attempting to delete lesson: ${name}. Implement a custom confirmation modal in production.`);
		
		const lessons = getLessonsFromStorage().filter(l => l.id !== id);
		saveLessonsToStorage(lessons);
		setSavedLessons(lessons);
		
		// If deleted lesson was current, reset to new default local plan
		if (currentLessonId === id) {
			setLessonPlan(DEFAULT_LESSON_STEPS); // Resets to empty array
			setLessonName(DEFAULT_LESSON_NAME);
			setCurrentLessonId(null);
			localStorage.removeItem(CURRENT_LESSON_ID_KEY);
		}
		
		setLoadMessage(`Lesson "${name}" deleted locally.`);
		setTimeout(() => setLoadMessage(null), 3000);
	};
	
	// --- GENERAL LOGIC ---

	// Handle keyboard navigation (Space/Arrows/F11/Escape) - Only in 'running' mode
	useEffect(() => {
		const handleKeyDown = (e) => {
			// F11: Toggle fullscreen (works in any mode)
			if (e.key === 'F11') {
				e.preventDefault(); // Prevent browser default F11 behavior
				toggleFullscreen();
				return;
			}
			
			if (mode !== 'running') return;

			// ESCAPE: Exit presentation
			if (e.key === 'Escape') {
				endClass();
				// Also exit fullscreen if we're in it
				if (document.fullscreenElement) {
					document.exitFullscreen().catch(console.log);
				}
				return;
			}

			if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
				nextSlide();
			} else if (e.key === 'ArrowLeft') {
				prevSlide();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [mode, currentIndex, lessonPlan]);

	// Helper to extract unique phrases/sentences (The Word Stock logic is correct)
	const extractUniquePhrases = (steps) => {
		// 1. Map to the full slide text, maintaining the order of appearance
		const allTexts = steps
			.map(step => step.text.trim())
			.filter(text => text.length > 0);
		
		// 2. Use a Set to filter out duplicates while preserving the order of first appearance.
		return Array.from(new Set(allTexts));
	}

	// --- LOGIC: Running Class ---

	const nextSlide = () => {
		if (currentIndex < lessonPlan.length - 1) {
			setCurrentIndex(currentIndex + 1);
		}
	};

	const prevSlide = () => {
		if (currentIndex > 0) {
			setCurrentIndex(currentIndex - 1);
		}
	};

	const endClass = () => {
		setMode('home');
		setCurrentIndex(0);
		setStock([]);
		// Exit fullscreen when ending class
		if (document.fullscreenElement) {
			document.exitFullscreen().catch(console.log);
			setIsFullscreen(false);
		}
	};

	const startClass = () => {
		if (!lessonPlan || lessonPlan.length === 0) return;
		setMode('running');
		
		// Generate stock using the unique phrases/sentences from the lesson steps
		setStock(extractUniquePhrases(lessonPlan));
		setCurrentIndex(0);	
	};

	// Neutralized styles
	const getTypeStyles = (type) => {
		return { color: 'text-white', icon: null };
	};

	// --- LOGIC: Editor ---

	const updateSlide = (index, field, value) => {
		const updated = [...lessonPlan];
		// Enforce 50 character limit for text field
		if (field === 'text' && value.length <= 50) {
			updated[index][field] = value;
		} else if (field !== 'text') {
			updated[index][field] = value;
		}
		setLessonPlan(updated);
	};

	const addSlide = () => {
		const newSlide = {	
			id: Date.now(),	
			text: "New Slide",	
			type: "statement",
		};
		setLessonPlan([...lessonPlan, newSlide]);
	};

	const deleteSlide = (index) => {
		// Only allow deletion if there is more than one slide, or if it's the last slide being deleted
		// The 'Create New Lesson' function ensures we start with at least one slide.
		if (lessonPlan.length === 1 && index === 0) {
			// If deleting the last slide, replace it with a fresh blank one instead of an empty array
			setLessonPlan([{ id: Date.now(), text: "Your First Slide", type: "statement" }]);
		} else if (lessonPlan.length > 0) {
			const updated = lessonPlan.filter((_, i) => i !== index);
			setLessonPlan(updated);
		}
	};

	const moveSlide = (index, direction) => {
		if (direction === 'up' && index === 0) return;
		if (direction === 'down' && index === lessonPlan.length - 1) return;
		
		const updated = [...lessonPlan];
		const targetIndex = direction === 'up' ? index - 1 : index + 1;
		[updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
		setLessonPlan(updated);
	};

	const createNewLesson = () => {
		// Start with one slide for immediate editing use
		setLessonPlan([{ id: Date.now(), text: "Your First Slide", type: "statement" }]);
		setLessonName('New Unsaved Lesson');
		setCurrentLessonId(null);
		setMode('editing');
		localStorage.removeItem(CURRENT_LESSON_ID_KEY);
		setLoadMessage('Starting a new blank lesson!');
		setTimeout(() => setLoadMessage(null), 3000);
	};
	
	// --- VIEWS ---
	
	// 1. HOME SCREEN (Multi-lesson view)
	if (mode === 'home') {
		
		const baseBtnClass = "flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-lg font-bold transition-all transform hover:scale-[1.01] disabled:opacity-50";

		return (
			<div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white font-sans p-4">
				<div className="max-w-xl w-full bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-8 space-y-6">
					
					<h1 className="text-5xl font-extrabold tracking-tighter text-indigo-400 text-center mb-6">
						ReFlex
					</h1>
					
					{/* Load Confirmation Message */}
					{loadMessage && (
						<div className="bg-emerald-600/20 text-emerald-300 p-3 rounded-xl font-semibold text-center transition-opacity duration-500">
							{loadMessage}
						</div>
					)}
					
					{/* Main Action Block - Centered and stacked buttons */}
					<div className="flex flex-col gap-3 items-center">
						{/* Primary Action Button: START CLASS (60% width) */}
						<button	
							onClick={startClass}
							// w-3/5 for 60% width
							className={`${baseBtnClass} w-3/5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-xl shadow-indigo-900/50`}
							disabled={!lessonPlan || lessonPlan.length === 0}
						>
							<Play className="fill-current w-6 h-6" /> Start Class
						</button>
						
						{/* Secondary Action Button: EDIT LESSON (80% width) */}
						<button	
							onClick={() => setMode('editing')}
							// w-4/5 for 80% width
							className={`${baseBtnClass} w-4/5 bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600 shadow-md`}
						>
							<Settings size={20} /> Edit Lesson
						</button>

						{/* Tertiary Action Button: CREATE NEW LESSON (Full width) */}
						<button	
							onClick={createNewLesson}
							// w-full for 100% width
							className={`${baseBtnClass} w-full bg-fuchsia-700 hover:bg-fuchsia-600 text-white shadow-md shadow-fuchsia-900/40`}
						>
							<FilePlus size={20} /> Create New Lesson
						</button>
					</div>
					
					{/* Lesson Management Section */}
					<div className="pt-4 space-y-3">
						<div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-left space-y-3">
							<h3 className="text-base font-bold text-indigo-400 flex items-center gap-2 border-b border-gray-700 pb-2"><FolderOpen size={18}/> Saved Lessons ({savedLessons.length})</h3>
							
							{savedLessons.length === 0 ? (
									<p className="text-gray-500 italic text-center text-sm">No saved lessons.</p>
							) : (
									<div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
											{savedLessons.map((lesson) => {
													const isCurrent = lesson.id === currentLessonId;
													
													// Determine the display name
													let displayName = lesson.name;
													
													return (
													<div	
															key={lesson.id}	
															className={`
																	flex justify-between items-center p-3 rounded-lg transition-all duration-200 text-sm
																	${isCurrent	
																			? 'bg-emerald-900/50 border border-emerald-500' // Highlighted style
																			: 'bg-gray-700 hover:bg-gray-600 border border-gray-700' // Default style
																	}
															`}
													>
															<span className="text-gray-200 font-medium truncate flex-1 pr-4">{displayName} ({lesson.steps.length} steps)</span>
															<div className="flex gap-2">
																	<button	
																			onClick={() => loadSavedLesson(lesson)}
																			className={`px-3 py-1 text-xs rounded-md font-bold transition-colors ${
																					isCurrent	
																							? 'bg-emerald-600 cursor-default text-white'	
																							: 'bg-indigo-600 hover:bg-indigo-500 text-white'
																			}`}
																			disabled={isCurrent}
																	>
																			{isCurrent ? 'Current' : 'Load'}
																	</button>
																	<button	
																			onClick={() => deleteSavedLesson(lesson.id, lesson.name)}
																			className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded"
																			title="Delete Lesson"
																	>
																			<Trash2 size={16} />
																	</button>
															</div>
													</div>
											)})}
									</div>
							)}
						</div>
						
						{/* Export/Import Section */}
						<div className="pt-4 border-t border-gray-700">
							<div className="flex gap-2">
								<button 
									onClick={exportLessons}
									disabled={savedLessons.length === 0}
									className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
								>
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
									</svg>
									Export All Lessons
								</button>
								<button 
									onClick={importLessons}
									className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
								>
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
									</svg>
									Import Lessons
								</button>
							</div>
							<p className="text-xs text-gray-500 text-center mt-2">
								Backup your lessons or transfer to another computer
							</p>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// 2. EDITOR SCREEN
	if (mode === 'editing') {
		return (
			<div className="min-h-screen bg-gray-950 text-white font-sans flex flex-col">
				{/* Sticky Header */}
				<div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm border-b-2 border-indigo-500/50 p-4 flex flex-col md:flex-row justify-between items-center shadow-lg">
					<h2 className="text-2xl font-bold text-indigo-400 mb-3 md:mb-0 flex items-center gap-2">
						<Settings /> Lesson Editor
					</h2>
					<div className="flex flex-wrap gap-2 items-center">
						
						<input
							type="text"
							value={lessonName}
							onChange={(e) => setLessonName(e.target.value)}
							placeholder="Lesson Name"
							className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-base text-white w-full md:w-48 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
						/>
						
						<button	
							onClick={() => saveCurrentLesson(lessonName)}	
							className="px-4 py-2 text-base bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-2 transition-colors shadow-md disabled:opacity-50"
							disabled={!lessonName.trim()}
						>
							<Bookmark size={18} /> Save & Exit
						</button>
					</div>
				</div>

				{/* Editor Content Area */}
				<div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto w-full space-y-4">
					<div className="grid grid-cols-12 gap-4 text-xs font-bold text-gray-400 uppercase tracking-wider px-4 border-b border-gray-700 pb-2">
						<div className="col-span-1 text-center">#</div>
						<div className="col-span-10">Slide Text (Max 50 Chars)</div>
						<div className="col-span-1 text-right">Delete</div>
					</div>

					{lessonPlan.map((step, index) => (
						<div key={step.id} className="grid grid-cols-12 gap-4 items-center bg-gray-900 p-3 rounded-xl border border-gray-700 shadow-md hover:border-indigo-500/50 transition-all duration-300">
							
							{/* Order Controls */}
							<div className="col-span-1 flex flex-col items-center gap-1">
								<button onClick={() => moveSlide(index, 'up')} disabled={index === 0} className="text-indigo-400 hover:text-indigo-300 disabled:opacity-20 transition-colors" title="Move Up"><ArrowUp size={16} /></button>
								<span className="text-gray-500 font-mono text-sm">{index + 1}</span>
								<button onClick={() => moveSlide(index, 'down')} disabled={index === lessonPlan.length - 1} className="text-indigo-400 hover:text-indigo-300 disabled:opacity-20 transition-colors" title="Move Down"><ArrowDown size={16} /></button>
							</div>

							{/* Display Text (col-span-10) */}
							<div className="col-span-10">	
								<input	
									type="text"	
									value={step.text}	
									onChange={(e) => updateSlide(index, 'text', e.target.value)}
									maxLength={50}
									className="w-full bg-gray-800 border-2 border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
									placeholder="e.g. I am not"
								/>
								<span className="text-xs text-gray-500 float-right mt-1">
									{step.text.length} / 50
								</span>
							</div>

							{/* Actions (col-span-1) */}
							<div className="col-span-1 text-right">
								<button	
									onClick={() => deleteSlide(index)}
									className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-900/30 rounded-full transition-colors"
									title="Delete Slide"
								>
									<Trash2 size={20} />
								</button>
							</div>

						</div>
					))}

					<button	
						onClick={addSlide}
						className="w-full py-4 bg-gray-900 border-2 border-dashed border-gray-700 text-indigo-400 hover:text-indigo-300 hover:border-indigo-400/50 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
					>
						<Plus size={24} /> Add New Slide
					</button>
					
					<div className="h-10" /> {/* Spacer */}
				</div>
			</div>
		);
	}

	// 3. RUNNING CLASS SCREEN
	const currentStep = lessonPlan[currentIndex] || lessonPlan[0]; // Safety fallback
	const styles = getTypeStyles(currentStep.type);	
	
	// FIXED FONT SIZING LOGIC
	const finalH1Class = 'text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-extrabold tracking-tight text-center w-full break-words';

	return (
		<div className="flex h-screen bg-gray-950 overflow-hidden font-sans">
			
			{/* LEFT AREA: Main Stage (Projection Mode) */}
			<div className="flex-1 flex flex-col relative">
				
				{/* Progress Bar */}
				<div className="w-full h-1 bg-gray-900 flex-shrink-0">
					<div	
						className="h-full bg-indigo-500 transition-all duration-300"
						style={{ width: `${((currentIndex + 1) / lessonPlan.length) * 100}%` }}
					/>
				</div>

				{/* Content Area: Full-screen centered text */}
				<div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
					<div className="flex-1 flex flex-col items-center justify-center p-8 z-10 w-full">
						<div className={`transition-all duration-300 transform text-white flex flex-col items-center w-full`}>
							<h1 
								className={finalH1Class}
							>
								{currentStep?.text || 'Lesson Empty'}
							</h1>
						</div>
					</div>
				</div>

				{/* Navigation Controls */}
				<div className="absolute bottom-8 right-8 flex gap-4 opacity-50 hover:opacity-100 transition-opacity z-30">
					<button 
						onClick={prevSlide} 
						disabled={currentIndex === 0}
						className="p-4 bg-gray-800/80 rounded-full text-indigo-400 hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-xl"
					>
						<ChevronLeft size={32} />
					</button>
					<button 
						onClick={nextSlide} 
						disabled={currentIndex === lessonPlan.length - 1}
						className="p-4 bg-indigo-600/90 rounded-full text-white hover:bg-indigo-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-xl shadow-indigo-900/50"
					>
						<ChevronRight size={32} />
					</button>
				</div>
				
				{/* End Class Button */}
				<div className="absolute top-8 left-8 opacity-40 hover:opacity-100 transition-opacity z-30">
					<button 
						onClick={endClass} 
						className="p-3 bg-gray-800/80 rounded-xl text-red-400 hover:bg-red-900/30 flex items-center gap-2 font-medium shadow-lg"
					>
						<RotateCcw size={18} /> End Class (ESC)
					</button>
				</div>
				
				{/* Fullscreen Button */}
				<div className="absolute bottom-8 left-8 opacity-40 hover:opacity-100 transition-opacity z-30">
					<button 
						onClick={toggleFullscreen}
						className="p-3 bg-gray-800/80 rounded-xl text-indigo-400 hover:bg-indigo-900/30 flex items-center gap-2 font-medium shadow-lg"
						title="F11: Toggle Fullscreen"
					>
						{isFullscreen ? 'Exit Fullscreen (F11)' : 'Fullscreen (F11)'}
					</button>
				</div>
			</div>

			{/* RIGHT AREA: Word Stock Sidebar */}
			<div className="w-full md:w-1/4 min-w-[200px] max-w-[300px] bg-gray-900 border-l border-gray-800 flex flex-col shadow-2xl z-20">
				<div className="p-6 border-b border-gray-800 bg-gray-800/50">
					<h2 className="text-indigo-400 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
						<Volume2 size={16} /> Word Stock
					</h2>
				</div>
				
				<div className="flex-1 p-4 overflow-y-auto space-y-3">
					{stock.map((phrase, idx) => (
						<div	
							key={`${phrase}-${idx}`}
							// Word Stock text wraps correctly here
							className={`
								text-lg font-medium px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-gray-100 
								hover:bg-gray-600 transition-all duration-300 shadow-sm break-words
							`}
						>
							{phrase}
						</div>
					))}
					
					{stock.length === 0 && (
						<div className="text-gray-600 italic text-center p-6">
							The slide phrases will appear here once you start the class.
						</div>
					)}
				</div>
			</div>

		</div>
	);
}