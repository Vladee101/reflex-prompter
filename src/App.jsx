import React, { useState, useEffect } from 'react';
import {
	Play, RotateCcw, ChevronRight, ChevronLeft, Volume2, Settings, Plus, Trash2, ArrowUp, ArrowDown, Bookmark, FolderOpen, FilePlus, X, Download
} from 'lucide-react';

import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
	useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- LOCAL STORAGE KEYS ---
const LESSONS_STORAGE_KEY = 'reflex_prompter_multi_lessons';
const CURRENT_LESSON_ID_KEY = 'reflex_current_lesson_id';

// --- DEFAULT DATA ---
const DEFAULT_LESSON_STEPS = [];
const DEFAULT_LESSON_NAME = 'Untitled Lesson';

// --- DND-KIT SORTABLE COMPONENT ---
function SortableWord(props) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: props.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			className={`pb-3 transition-opacity duration-300 touch-none cursor-grab ${isDragging ? 'opacity-50 relative z-50' : 'opacity-100'}`}
		>
			<div className={`
				text-lg font-medium px-4 py-2 rounded-lg 
				bg-gray-700 border border-gray-600 text-gray-100 
				hover:bg-gray-600 shadow-sm break-words select-none
				${isDragging ? 'border-dashed border-indigo-400 cursor-grabbing bg-gray-600' : ''}
			`}>
				{props.phrase}
			</div>
		</div>
	);
}

export default function App() {
	// Modes: 'home', 'running', 'editing'
	const [mode, setMode] = useState('home');

	// Lesson Data State
	const [lessonPlan, setLessonPlan] = useState(DEFAULT_LESSON_STEPS);
	const [lessonName, setLessonName] = useState(DEFAULT_LESSON_NAME);
	const [currentLessonId, setCurrentLessonId] = useState(null);

	// Storage State
	const [savedLessons, setSavedLessons] = useState([]);

	// Running State
	const [currentIndex, setCurrentIndex] = useState(0);
	const [stock, setStock] = useState([]);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 5,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	const handleDragEnd = (event) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			const oldIndex = stock.indexOf(active.id);
			const newIndex = stock.indexOf(over.id);

			const newStock = arrayMove(stock, oldIndex, newIndex);
			setStock(newStock);

			// Reorder the actual lesson plan slides based on the new Word Stock sequence
			const currentSlideId = lessonPlan[currentIndex]?.id;
			const groupedSteps = {};
			const emptySteps = [];

			lessonPlan.forEach(step => {
				const text = (step.text || '').trim();
				if (text) {
					if (!groupedSteps[text]) groupedSteps[text] = [];
					groupedSteps[text].push(step);
				} else {
					emptySteps.push(step);
				}
			});

			const newPlan = [];

			// Build the new lesson plan in the order of the Word Stock items
			newStock.forEach(stockText => {
				if (groupedSteps[stockText]) {
					newPlan.push(...groupedSteps[stockText]);
					delete groupedSteps[stockText]; // mark as processed
				}
			});

			// Append any steps that weren't in the stock
			Object.values(groupedSteps).forEach(steps => newPlan.push(...steps));
			newPlan.push(...emptySteps);

			setLessonPlan(newPlan);

			// Keep the presenter on the exact same slide they were looking at
			if (currentSlideId) {
				const newCurrentIndex = newPlan.findIndex(s => s.id === currentSlideId);
				if (newCurrentIndex !== -1) {
					setCurrentIndex(newCurrentIndex);
				}
			}
		}
	};

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
	// --- EXPORT/IMPORT FUNCTIONS ---
	const exportLessons = (lesson) => {
		if (!lesson) return;

		// Wrap single lesson in array to maintain import compatibility
		const lessonsToExport = [lesson];

		const dataStr = JSON.stringify(lessonsToExport, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });

		// Create download link
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement('a');
		link.href = url;
		// Sanitize filename
		const safeName = lesson.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
		link.download = `reflex_lesson_${safeName}_${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
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

					// Merge processes
					const existingLessons = getLessonsFromStorage();
					const existingIds = new Set(existingLessons.map(l => l.id));

					const processedImports = importedData.map(lesson => {
						if (existingIds.has(lesson.id)) {
							// It's a duplicate! Create a copy.
							return {
								...lesson,
								id: crypto.randomUUID(), // New unique ID
								name: `${lesson.name} (Copy)`, // Verify distinction
								updatedAt: new Date().toISOString()
							};
						}
						return lesson;
					});

					const updatedLessons = [...existingLessons, ...processedImports];

					// Save to storage
					saveLessonsToStorage(updatedLessons);
					setSavedLessons(updatedLessons);

				} catch (error) {
					console.error(`Import failed: ${error.message}`);
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
				type: step.type || "shortText",
				imageData: step.imageData || null
			})));
		} else if (storedLessons.length > 0) {
			// If no stored ID, default to the first saved lesson
			activeLesson = storedLessons[0];
			setCurrentLessonId(activeLesson.id);
			setLessonName(activeLesson.name);
			setLessonPlan(activeLesson.steps.map(step => ({
				id: step.id,
				text: step.text,
				type: step.type || "shortText",
				imageData: step.imageData || null
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
			type: step.type || "shortText", // Ensure type is saved
			imageData: step.imageData || null
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
		setMode('home');
	};

	const loadSavedLesson = (lesson) => {
		// Load the lesson from the saved data
		setLessonPlan(lesson.steps.map(step => ({
			id: step.id,
			text: step.text,
			type: step.type || "shortText",
			imageData: step.imageData || null
		})));
		setLessonName(lesson.name);
		setCurrentLessonId(lesson.id);
		setMode('home');
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

	// --- LOGIC: Drag and Drop (Word Stock) - REMOVED

	// Neutralized styles
	const getTypeStyles = (type) => {
		return { color: 'text-white', icon: null };
	};

	// --- LOGIC: Editor ---

	const updateSlide = (index, field, value) => {
		const updated = [...lessonPlan];

		// Enforce conditions based on field
		if (field === 'text' && updated[index].type === 'shortText' && value.length > 50) {
			return; // Do nothing if exceeding limit for short text
		}

		updated[index][field] = value;
		setLessonPlan(updated);
	};

	const handleImageUpload = (index, event) => {
		const file = event.target.files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			updateSlide(index, 'imageData', e.target.result);
			updateSlide(index, 'text', file.name); // Set text to filename for the word stock/preview
		};
		reader.readAsDataURL(file);
	};

	const addSlide = () => {
		const newSlide = {
			id: Date.now(),
			text: "New Slide",
			type: "shortText",
			imageData: null
		};
		setLessonPlan([...lessonPlan, newSlide]);
	};

	const deleteSlide = (index) => {
		// Only allow deletion if there is more than one slide, or if it's the last slide being deleted
		// The 'Create New Lesson' function ensures we start with at least one slide.
		if (lessonPlan.length === 1 && index === 0) {
			// If deleting the last slide, replace it with a fresh blank one instead of an empty array
			setLessonPlan([{ id: Date.now(), text: "Your First Slide", type: "shortText", imageData: null }]);
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
		setLessonPlan([{ id: Date.now(), text: "Your First Slide", type: "shortText", imageData: null }]);
		setLessonName('New Unsaved Lesson');
		setCurrentLessonId(null);
		setMode('editing');
		localStorage.removeItem(CURRENT_LESSON_ID_KEY);
	};

	const exitWithoutSaving = () => {
		setMode('home');
		// If we were editing an existing lesson, reload it to discard changes
		if (currentLessonId) {
			const originalLesson = savedLessons.find(l => l.id === currentLessonId);
			if (originalLesson) {
				loadSavedLesson(originalLesson);
			}
		} else {
			// If it was a new lesson, just reset
			setLessonPlan(DEFAULT_LESSON_STEPS);
			setLessonName(DEFAULT_LESSON_NAME);
			setCurrentLessonId(null);
		}
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
							<h3 className="text-base font-bold text-indigo-400 flex items-center gap-2 border-b border-gray-700 pb-2"><FolderOpen size={18} /> Saved Lessons ({savedLessons.length})</h3>

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
														onClick={() => exportLessons(lesson)}
														className="p-1 text-gray-400 hover:text-blue-400 hover:bg-blue-900/20 rounded"
														title="Export Lesson"
													>
														<Download size={16} />
													</button>
													<button
														onClick={() => loadSavedLesson(lesson)}
														className={`px-3 py-1 text-xs rounded-md font-bold transition-colors ${isCurrent
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
										)
									})}
								</div>
							)}
						</div>

						{/* Export/Import Section */}
						<div className="pt-4 border-t border-gray-700">
							<div className="flex gap-2">
								<button
									onClick={importLessons}
									className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
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
						<button
							onClick={exitWithoutSaving}
							className="px-4 py-2 text-base bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold flex items-center gap-2 transition-colors shadow-md"
						>
							<X size={18} /> Exit Without Saving
						</button>
					</div>
				</div>

				{/* Editor Content Area */}
				<div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto w-full space-y-4">
					<div className="grid grid-cols-12 gap-4 text-xs font-bold text-gray-400 uppercase tracking-wider px-4 border-b border-gray-700 pb-2">
						<div className="col-span-1 text-center">#</div>
						<div className="col-span-10">Slide Content</div>
						<div className="col-span-1 text-right">Delete</div>
					</div>

					{lessonPlan.map((step, index) => (
						<div key={step.id} className="grid grid-cols-12 gap-4 items-start bg-gray-900 p-3 rounded-xl border border-gray-700 shadow-md hover:border-indigo-500/50 transition-all duration-300">

							{/* Order Controls */}
							<div className="col-span-1 flex flex-col items-center gap-1 pt-2">
								<button onClick={() => moveSlide(index, 'up')} disabled={index === 0} className="text-indigo-400 hover:text-indigo-300 disabled:opacity-20 transition-colors" title="Move Up"><ArrowUp size={16} /></button>
								<span className="text-gray-500 font-mono text-sm">{index + 1}</span>
								<button onClick={() => moveSlide(index, 'down')} disabled={index === lessonPlan.length - 1} className="text-indigo-400 hover:text-indigo-300 disabled:opacity-20 transition-colors" title="Move Down"><ArrowDown size={16} /></button>
							</div>

							{/* Display Content (col-span-10) */}
							<div className="col-span-10 space-y-2">
								<div className="flex items-center gap-2">
									<select
										value={step.type || 'shortText'} // Default to shortText if old format statement
										onChange={(e) => updateSlide(index, 'type', e.target.value)}
										className="bg-gray-800 border border-gray-600 text-gray-200 text-sm rounded-lg py-1 px-2 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 max-w-[160px]"
									>
										<option value="shortText">Short Text (Max 50)</option>
										<option value="longText">Long Text</option>
										<option value="image">Image Display</option>
									</select>
								</div>

								{(step.type === 'shortText' || step.type === 'statement' || !step.type) && (
									<div>
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
								)}

								{step.type === 'longText' && (
									<div>
										<textarea
											value={step.text}
											onChange={(e) => updateSlide(index, 'text', e.target.value)}
											rows={3}
											className="w-full bg-gray-800 border-2 border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors resize-y"
											placeholder="Enter paragraphs of text here..."
										/>
									</div>
								)}

								{step.type === 'image' && (
									<div className="bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg p-4 flex flex-col items-center justify-center min-h-[100px]">
										{step.imageData ? (
											<div className="relative group">
												<img src={step.imageData} alt="slide preview" className="max-h-32 rounded-md object-contain" />
												<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-md">
													<label className="cursor-pointer px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white">
														Change Image
														<input
															type="file"
															accept="image/png, image/jpeg, image/jpg"
															onChange={(e) => handleImageUpload(index, e)}
															className="hidden"
														/>
													</label>
												</div>
											</div>
										) : (
											<div className="flex flex-col items-center">
												<p className="text-sm text-gray-400 mb-2">No image selected</p>
												<label className="cursor-pointer px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm text-white font-medium shadow-md transition-colors">
													Upload Image
													<input
														type="file"
														accept="image/png, image/jpeg, image/jpg"
														onChange={(e) => handleImageUpload(index, e)}
														className="hidden"
													/>
												</label>
											</div>
										)}
									</div>
								)}
							</div>

							{/* Actions (col-span-1) */}
							<div className="col-span-1 text-right pt-2">
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

	const renderCurrentStep = () => {
		if (!currentStep) return <h1 className="text-6xl text-gray-500">Lesson Empty</h1>

		if (currentStep.type === 'image' && currentStep.imageData) {
			return (
				<img
					src={currentStep.imageData}
					alt="slide"
					className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
				/>
			);
		}

		if (currentStep.type === 'longText') {
			return (
				<div className="w-full max-w-5xl px-8">
					<p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight font-semibold text-center text-white break-words whitespace-pre-wrap">
						{currentStep.text || '...'}
					</p>
				</div>
			);
		}

		// Default (shortText / statement)
		return (
			<h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-extrabold tracking-tight text-center w-full break-words text-white">
				{currentStep.text || '...'}
			</h1>
		);
	};

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

				{/* Content Area: Full-screen centered text/image */}
				<div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
					<div className="flex-1 flex flex-col items-center justify-center p-8 z-10 w-full animate-fade-in">
						{renderCurrentStep()}
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

				<div className="flex-1 p-4 overflow-y-auto">
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={handleDragEnd}
					>
						<SortableContext
							items={stock}
							strategy={verticalListSortingStrategy}
						>
							{stock.map((phrase) => (
								<SortableWord key={phrase} id={phrase} phrase={phrase} />
							))}
						</SortableContext>
					</DndContext>

					{stock.length === 0 && (
						<div className="text-gray-600 italic text-center p-6">
							The slide phrases will appear here once you start the class.
						</div>
					)}
				</div>
			</div>

		</div >
	);
}