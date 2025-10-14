import { useState } from 'react';
import { ModalButton } from '../components/CustomModal';

interface ModalConfig {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  buttons: ModalButton[];
}

export const useModal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [config, setConfig] = useState<ModalConfig>({
    type: 'info',
    title: '',
    message: '',
    buttons: [],
  });

  const showModal = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    buttons: ModalButton[] = [{ text: 'OK', onPress: () => hideModal() }]
  ) => {
    setConfig({ type, title, message, buttons });
    setIsVisible(true);
  };

  const hideModal = () => {
    setIsVisible(false);
  };

  // Convenience methods
  const showSuccess = (title: string, message: string, buttons?: ModalButton[]) => {
    showModal('success', title, message, buttons);
  };

  const showError = (title: string, message: string, buttons?: ModalButton[]) => {
    showModal('error', title, message, buttons);
  };

  const showWarning = (title: string, message: string, buttons?: ModalButton[]) => {
    showModal('warning', title, message, buttons);
  };

  const showInfo = (title: string, message: string, buttons?: ModalButton[]) => {
    showModal('info', title, message, buttons);
  };

  // Alert.alert replacement
  const showAlert = (
    title: string,
    message?: string,
    buttons?: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>
  ) => {
    const modalButtons: ModalButton[] = buttons 
      ? buttons.map(btn => ({
          text: btn.text,
          onPress: btn.onPress || hideModal,
          style: btn.style === 'destructive' ? 'danger' : 
                btn.style === 'cancel' ? 'secondary' : 'primary'
        }))
      : [{ text: 'OK', onPress: hideModal }];

    const modalType = buttons?.some(btn => btn.style === 'destructive') ? 'warning' : 'info';
    
    showModal(modalType, title, message || '', modalButtons);
  };

  return {
    isVisible,
    config,
    showModal,
    hideModal,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showAlert,
  };
};