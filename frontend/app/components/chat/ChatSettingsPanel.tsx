'use client';

import { useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { SYSTEM_PROMPT } from '@/lib/chatPrompts';
import { storageService } from '@/lib/storageService';

import styles from '@/app/page.module.css';
import formStyles from '@/lib/styles/forms.module.css';

export interface ChatSettingsPanelProps {
  visible: boolean;
  customPrompt: string;
  onCustomPromptChange: (value: string) => void;
  onClose: () => void;
}

/**
 * チャット設定パネルコンポーネント
 * 役割: カスタムシステムプロンプト編集UI
 */
export function ChatSettingsPanel({
  visible,
  customPrompt,
  onCustomPromptChange,
  onClose
}: ChatSettingsPanelProps) {

  const handleSavePrompt = useCallback(() => {
    if (customPrompt.trim()) {
      storageService.setItem('visionfy-custom-system-prompt', customPrompt);
    } else {
      storageService.removeItem('visionfy-custom-system-prompt');
      onCustomPromptChange('');
    }
    onClose();
  }, [customPrompt, onCustomPromptChange, onClose]);

  const handleResetPrompt = useCallback(() => {
    storageService.removeItem('visionfy-custom-system-prompt');
    onCustomPromptChange('');
  }, [onCustomPromptChange]);

  if (!visible) return null;

  return (
    <div className={styles.chatSettingsPanel}>
      <FormField
        label="システムプロンプト"
        type="textarea"
        name="systemPrompt"
        value={customPrompt || SYSTEM_PROMPT}
        onChange={(e) => onCustomPromptChange(e.target.value)}
        rows={6}
        className={styles.chatSettingsLabel}
        inputClassName={formStyles['input-textarea']}
      />
      <div className={styles.chatSettingsBtnGroup}>
        <Button variant="secondary" size="sm" onClick={handleResetPrompt}>
          デフォルトに戻す
        </Button>
        <Button variant="primary" size="sm" onClick={handleSavePrompt}>
          保存
        </Button>
      </div>
    </div>
  );
}
