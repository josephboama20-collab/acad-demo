import { AuthProvider } from './contexts/AuthContext.jsx';
import { GameProvider } from './contexts/GameContext.jsx';
import { CoursesProvider } from './contexts/CoursesContext.jsx';
import { FlashcardMasteryBridge } from './contexts/FlashcardMasteryBridge.jsx';
import { HabitsProvider } from './contexts/HabitsContext.jsx';
import { StudyGroupsProvider } from './contexts/StudyGroupsContext.jsx';
import { SemestersProvider } from './contexts/SemestersContext.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import App from './App.jsx';

export default function AppRoot() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <GameProvider>
        <CoursesProvider>
          <FlashcardMasteryBridge>
            <HabitsProvider>
              <StudyGroupsProvider>
                <SemestersProvider>
                  <App />
                </SemestersProvider>
              </StudyGroupsProvider>
            </HabitsProvider>
          </FlashcardMasteryBridge>
        </CoursesProvider>
      </GameProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}
