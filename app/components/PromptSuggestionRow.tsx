import { PromptSuggestionButton } from './PromptSuggestionButton';

type PromptSuggestionRowProps = {
  onPromptClick: (prompt: string) => void;
};

export const PromptSuggestionRow = ({ onPromptClick }: PromptSuggestionRowProps) => {
  const prompts = [
    'Who is the current world champion?',
    'Who is the highest rated Chess Player?',
    'How to play chess?',
  ];
  return (
    <div className="prompt-suggestion-row">
      {prompts.map((prompt, index) => (
        <PromptSuggestionButton
          key={index}
          text={prompt}
          onClick={() => onPromptClick(prompt)}
        />
      ))}
    </div>
  );
};