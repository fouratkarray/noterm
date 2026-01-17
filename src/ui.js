import React, {useState, useEffect} from 'react';
import {Box, Text, useInput, useApp} from 'ink';
import TextInput from 'ink-text-input';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const NOTES_FILE = path.join(process.cwd(), 'notes.json'); // Save notes in the current working directory

const App = () => {
	const [notes, setNotes] = useState([]);
	const [input, setInput] = useState('');
	const [editIndex, setEditIndex] = useState(-1);
	const {exit} = useApp();

	useEffect(() => {
		if (fs.existsSync(NOTES_FILE)) {
			try {
				const data = fs.readFileSync(NOTES_FILE, 'utf8');
				setNotes(JSON.parse(data));
			} catch (err) {
				// Ignore error
			}
		}
	}, []);

	const saveNotes = (newNotes) => {
		setNotes(newNotes);
		fs.writeFileSync(NOTES_FILE, JSON.stringify(newNotes, null, 2));
	};

	const handleSubmit = () => {
		if (editIndex >= 0 && editIndex < notes.length) {
			if (!input.trim()) {
				// Delete note if input is empty
				const newNotes = notes.filter((_, index) => index !== editIndex);
				saveNotes(newNotes);
				setEditIndex(-1);
			} else {
				// Update note
				const newNotes = [...notes];
				newNotes[editIndex] = {...newNotes[editIndex], text: input};
				saveNotes(newNotes);
				setEditIndex(-1);
			}
		} else {
			if (!input.trim()) return;
			// Create new note
			const newNotes = [...notes, {id: Date.now(), text: input}];
			saveNotes(newNotes);
		}
		setInput('');
	};

	useInput((input, key) => {
		if (key.escape) {
			exit();
		}

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
	});

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
					<Text color="gray">Aucune note. Écrivez quelque chose ci-dessous.</Text>
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

			<Box borderStyle="round" borderColor={editIndex !== -1 ? "yellow" : "blue"} paddingX={1} width="100%">
				<Box marginRight={1}>
					<Text color={editIndex !== -1 ? "yellow" : "blue"}>
						{editIndex !== -1 ? "✎" : "❯"}
					</Text>
				</Box>
				<Box flexGrow={1}>
					<TextInput
						value={input}
						onChange={setInput}
						onSubmit={handleSubmit}
						placeholder="Tapez votre note et appuyez sur Entrée..."
					/>
				</Box>
			</Box>
			
			<Box marginTop={1}>
				<Text color="gray">Appuyez sur 'Echap' pour quitter.</Text>
			</Box>
		</Box>
	);
};

export default App;