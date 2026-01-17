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
		langPrompt: "Choose language: 'en' or 'fr'",
	},
	fr: {
		noNotes: "Aucune note. Écrivez quelque chose ci-dessous.",
		placeholder: "Tapez votre note et appuyez sur Entrée...",
		quit: "Appuyez sur 'Echap' pour quitter.",
		langPrompt: "Choisissez la langue : 'en' ou 'fr'",
	}
};

const commands = ['/lang', '/help', '/exit'];

const App = () => {
	const [notes, setNotes] = useState([]);
	const [input, setInput] = useState('');
	const [editIndex, setEditIndex] = useState(-1);
	const [lang, setLang] = useState('en');
	const [isLangMode, setIsLangMode] = useState(false);
	const [showHelp, setShowHelp] = useState(false);
	const [commandIndex, setCommandIndex] = useState(0);
	const {exit} = useApp();

	useEffect(() => {
		if (fs.existsSync(NOTES_FILE)) {
			try {
				const data = fs.readFileSync(NOTES_FILE, 'utf8');
				const parsed = JSON.parse(data);
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
				if (trimmedInput === 'en') {
					setLang('en');
					setIsLangMode(false);
					saveAll(notes, 'en');
				} else if (trimmedInput === 'fr') {
					setLang('fr');
					setIsLangMode(false);
					saveAll(notes, 'fr');
				}
				setInput('');
				return;
			}
	
			if (trimmedInput.startsWith('/')) {
				const filtered = commands.filter(cmd => cmd.startsWith(trimmedInput) || trimmedInput === '/');
				const selectedCommand = filtered[commandIndex] || trimmedInput;
				
				if (selectedCommand === '/lang') {
					setIsLangMode(true);
				} else if (selectedCommand === '/help') {
					setShowHelp(!showHelp);
				} else if (selectedCommand === '/exit') {
					exit();
				}
				
				setInput('');
				setCommandIndex(0);
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
	
		const filteredCommands = input.startsWith('/') 
			? commands.filter(cmd => cmd.startsWith(input.toLowerCase()) || input === '/')
			: [];
	
		useInput((inputVal, key) => {
			if (key.escape) {
				if (showHelp) {
					setShowHelp(false);
				} else {
					exit();
				}
			}
			
			const isCommandInput = input.startsWith('/');
	
			if (isCommandInput && !isLangMode) {
				if (key.downArrow || key.upArrow) {
					const direction = key.downArrow ? 1 : -1;
					const nextIndex = (commandIndex + direction + filteredCommands.length) % filteredCommands.length;
					setCommandIndex(nextIndex);
					return;
				}
			}
	
			if (!isLangMode && !showHelp && !isCommandInput) {
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
	
		// Reset command index when filtering changes
		useEffect(() => {
			setCommandIndex(0);
		}, [filteredCommands.length]);
	
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
	
							{showHelp ? (
								<Box flexDirection="column" marginBottom={1} borderStyle="double" borderColor="green" padding={1}>
									<Text bold color="green">HELP / AIDE</Text>
									<Text>Type text + Enter: Create note</Text>
									<Text>Up/Down Arrow: Edit notes</Text>
									<Text>Empty note + Enter: Delete note</Text>
									<Text>/lang: Switch language</Text>
									<Text>/exit: Quit application</Text>
									<Text color="gray">Press Esc to close help</Text>
								</Box>
							) : (
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
							)}
				
							{isCommand && !isLangMode && filteredCommands.length > 0 && (
								<Box flexDirection="column" marginBottom={1} borderStyle="single" borderColor="blue" paddingX={1}>
									<Text bold color="blue">Commands:</Text>
									{filteredCommands.map((cmd, index) => (
										<Box key={cmd}>
											<Text color={index === commandIndex ? "green" : "white"} bold={index === commandIndex}>
												{index === commandIndex ? "❯ " : "  "}
												{cmd} 
											</Text>
											<Text color="gray">
												{cmd === '/lang' ? (lang === 'fr' ? ' - Langue' : ' - Language') : 
												 cmd === '/help' ? (lang === 'fr' ? ' - Aide' : ' - Help') :
												 cmd === '/exit' ? (lang === 'fr' ? ' - Quitter' : ' - Exit') : ''}
											</Text>
										</Box>
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