import React, {useState, useEffect} from 'react';
import {Box, Text, useInput, useApp} from 'ink';
import TextInput from 'ink-text-input';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const NOTES_FILE = path.join(process.cwd(), 'notes.json');

const translations = {
	en: {
		noNotes: "No notes. Type something below.",
		placeholder: "Type your note and press Enter...",
		quit: "Press 'Esc' to quit.",
		langPrompt: "Choose language: 'english' or 'francais'",
	},
	fr: {
		noNotes: "Aucune note. Écrivez quelque chose ci-dessous.",
		placeholder: "Tapez votre note et appuyez sur Entrée...",
		quit: "Appuyez sur 'Echap' pour quitter.",
		langPrompt: "Choisissez la langue : 'english' ou 'francais'",
	}
};

const commands = ['/languages'];

const App = () => {
	const [notes, setNotes] = useState([]);
	const [input, setInput] = useState('');
	const [editIndex, setEditIndex] = useState(-1);
	const [lang, setLang] = useState('en');
	const [isLangMode, setIsLangMode] = useState(false);
	const [commandIndex, setCommandIndex] = useState(0);
	const {exit} = useApp();

	useEffect(() => {
		if (fs.existsSync(NOTES_FILE)) {
			try {
				const data = fs.readFileSync(NOTES_FILE, 'utf8');
				const parsed = JSON.parse(data);
				// Check if it's the old format or new format with settings
				if (Array.isArray(parsed)) {
					setNotes(parsed);
				} else {
					setNotes(parsed.notes || []);
					setLang(parsed.lang || 'en');
				}
			} catch (err) {
				// Ignore error
			}
		}
	}, []);

	const saveAll = (newNotes, newLang) => {
		const dataToSave = {
			notes: newNotes,
			lang: newLang
		};
		fs.writeFileSync(NOTES_FILE, JSON.stringify(dataToSave, null, 2));
	};

	const handleSubmit = () => {
		const trimmedInput = input.trim().toLowerCase();

		if (isLangMode) {
			if (trimmedInput === 'english' || trimmedInput === 'en') {
				setLang('en');
				setIsLangMode(false);
				saveAll(notes, 'en');
			} else if (trimmedInput === 'francais' || trimmedInput === 'fr') {
				setLang('fr');
				setIsLangMode(false);
				saveAll(notes, 'fr');
			}
			setInput('');
			return;
		}

		if (trimmedInput === '/languages') {
			setIsLangMode(true);
			setInput('');
			return;
		}

		if (editIndex >= 0 && editIndex < notes.length) {
			if (!input.trim()) {
				const newNotes = notes.filter((_, index) => index !== editIndex);
				setNotes(newNotes);
				saveAll(newNotes, lang);
				setEditIndex(-1);
			} else {
				const newNotes = [...notes];
				newNotes[editIndex] = {...newNotes[editIndex], text: input};
				setNotes(newNotes);
				saveAll(newNotes, lang);
				setEditIndex(-1);
			}
		} else {
			if (!input.trim()) return;
			const newNotes = [...notes, {id: Date.now(), text: input}];
			setNotes(newNotes);
			saveAll(newNotes, lang);
		}
		setInput('');
	};

	useInput((input, key) => {
		if (key.escape) {
			exit();
		}
		
		const isCommandInput = input.startsWith('/');

		if (isCommandInput && !isLangMode) {
			if (key.downArrow || key.upArrow) {
				const direction = key.downArrow ? 1 : -1;
				const nextIndex = (commandIndex + direction + commands.length) % commands.length;
				setCommandIndex(nextIndex);
				setInput(commands[nextIndex]);
			}
			return; // Skip note navigation
		}

		if (!isLangMode) {
			if (key.upArrow) {
				if (notes.length === 0) return;
				const newIndex = editIndex === -1 ? notes.length - 1 : Math.max(0, editIndex - 1);
				setEditIndex(newIndex);
				setInput(notes[newIndex].text);
			}

			if (key.downArrow) {
				if (editIndex === -1) return;
				const newIndex = editIndex + 1;
				if (newIndex >= notes.length) {
					setEditIndex(-1);
					setInput('');
				} else {
					setEditIndex(newIndex);
					setInput(notes[newIndex].text);
				}
			}
		}
	});

	const t = translations[lang];
	const isCommand = input.startsWith('/');

	return (
		<Box flexDirection="column" padding={1}>
			<Box marginBottom={1} flexDirection="column">
				<Text color="cyan">
					{`
███╗   ██╗ ██████╗ ████████╗███████╗██████╗ ███╗   ███╗
████╗  ██║██╔═══██╗╚══██╔══╝██╔════╝██╔══██╗████╗ ████║
██╔██╗ ██║██║   ██║   ██║   █████╗  ██████╔╝██╔████╔██║
██║╚██╗██║██║   ██║   ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║
██║ ╚████║╚██████╔╝   ██║   ███████╗██║  ██║██║ ╚═╝ ██║
╚═╝  ╚═══╝ ╚═════╝    ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝
`}
				</Text>
			</Box>

			<Box flexDirection="column" marginBottom={1}>
				{notes.length === 0 ? (
					<Text color="gray">{t.noNotes}</Text>
				) : (
					notes.map((note, index) => (
						<Box key={note.id}>
							<Text color={index === editIndex ? "yellow" : "green"}>
								{index === editIndex ? "✎ " : "- "}
							</Text>
							<Text color={index === editIndex ? "yellow" : "white"}>{note.text}</Text>
						</Box>
					))
				)}
			</Box>

			{isCommand && !isLangMode && (
				<Box flexDirection="column" marginBottom={1} borderStyle="single" borderColor="blue" paddingX={1}>
					<Text bold color="blue">Commands:</Text>
					{commands.map((cmd, index) => (
						<Text key={cmd} color={index === commandIndex ? "green" : "white"}>
							{index === commandIndex ? "> " : "  "}
							{cmd} - {cmd === '/languages' ? (lang === 'fr' ? 'Changer la langue' : 'Change language') : ''}
						</Text>
					))}
				</Box>
			)}

			<Box borderStyle="round" borderColor={isLangMode ? "magenta" : (editIndex !== -1 ? "yellow" : "blue")} paddingX={1} width="100%">
				<Box marginRight={1}>
					<Text color={isLangMode ? "magenta" : (editIndex !== -1 ? "yellow" : "blue")}>
						{isLangMode ? "?" : (editIndex !== -1 ? "✎" : "❯")}
					</Text>
				</Box>
				<Box flexGrow={1}>
					<TextInput
						value={input}
						onChange={setInput}
						onSubmit={handleSubmit}
						placeholder={isLangMode ? t.langPrompt : t.placeholder}
						color={isCommand ? "blue" : undefined}
					/>
				</Box>
			</Box>
			
			<Box marginTop={1}>
				<Text color="gray">{t.quit}</Text>
			</Box>
		</Box>
	);
};

export default App;