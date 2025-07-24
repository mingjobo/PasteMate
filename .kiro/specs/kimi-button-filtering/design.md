# Design Document

## Overview

This design addresses the Kimi-specific issues in the PureText One-Click extension by implementing intelligent message type detection and enhanced content filtering. The solution focuses on two main areas: accurate identification of AI vs human messages, and improved text extraction that excludes Kimi's native UI elements.

## Architecture

### Component Modifications

1. **KimiMessageDetector** - New specialized detector for Kimi message classification
2. **Enhanced ClipboardManager** - Improved text extraction with Kimi-specific filtering
3. **Updated ButtonInjector** - Modified injection logic with message type validation
4. **Kimi Site Configuration** - Enhanced selectors and filtering rules

### Integration Points

- Integrates with existing SiteManager for Kimi-specific configuration
- Extends ClipboardManager with Kimi-aware content filtering
- Enhances ButtonInjector with message type validation
- Maintains compatibility with existing extension architecture

## Components and Interfaces

### KimiMessageDetector

```javascript
class KimiMessageDetector {
  /**
   * Determines if an element contains a human message
   * @param {HTMLElement} element - Element to analyze
   * @returns {boolean} True if human message
   */
  static isHumanMessage(element)
  
  /**
   * Determines if an element contains an AI response
   * @param {HTMLElement} element - Element to analyze
   * @returns {boolean} True if AI response
   */
  static isAIResponse(element)
  
  /**
   * Analyzes element characteristics for message type
   * @param {HTMLElement} element - Element to analyze
   * @returns {Object} Analysis results with confidence scores
   */
  static analyzeMessageType(element)
}
```

### Enhanced ClipboardManager

```javascript
class ClipboardManager {
  /**
   * Kimi-specific text extraction with UI element filtering
   * @param {HTMLElement} element - Element to extract text from
   * @returns {string} Cleaned plain text
   */
  static extractKimiPlainText(element)
  
  /**
   * Removes Kimi-specific UI elements from cloned element
   * @param {HTMLElement} clonedElement - Cloned element to clean
   * @returns {HTMLElement} Cleaned element
   */
  static removeKimiUIElements(clonedElement)
}
```

### Updated ButtonInjector

```javascript
class ButtonInjector {
  /**
   * Validates if button should be injected based on message type
   * @param {HTMLElement} element - Target element
   * @returns {boolean} True if button should be injected
   */
  validateButtonInjection(element)
  
  /**
   * Removes incorrectly placed buttons from human messages
   */
  cleanupIncorrectButtons()
}
```

## Data Models

### Message Type Classification

```javascript
const MessageType = {
  HUMAN: 'human',
  AI: 'ai',
  UNKNOWN: 'unknown'
};

const MessageAnalysis = {
  type: MessageType,
  confidence: Number, // 0-1 confidence score
  indicators: Array,  // List of detection indicators used
  element: HTMLElement
};
```

### Kimi UI Element Patterns

```javascript
const KimiUIPatterns = {
  copyButtons: [
    'button[title*="复制"]',
    'button[aria-label*="复制"]',
    '.copy-button',
    '[data-action="copy"]'
  ],
  shareButtons: [
    'button[title*="分享"]',
    'button[aria-label*="分享"]',
    '.share-button',
    '[data-action="share"]'
  ],
  actionContainers: [
    '.message-actions',
    '.response-actions',
    '.action-bar'
  ]
};
```

## Error Handling

### Detection Failures
- Fallback to content-based analysis if CSS selectors fail
- Log detection confidence scores for debugging
- Graceful degradation to current behavior if classification fails

### Content Extraction Issues
- Multiple filtering passes to ensure UI elements are removed
- Validation of extracted content length and quality
- Fallback to basic extraction if Kimi-specific filtering fails

### Dynamic Content Updates
- Re-evaluation of message types when DOM changes
- Cleanup of incorrectly placed buttons during updates
- Debounced processing to handle rapid content changes

## Testing Strategy

### Unit Tests
- KimiMessageDetector classification accuracy
- ClipboardManager Kimi-specific filtering
- UI element pattern matching
- Edge cases with mixed content

### Integration Tests
- End-to-end button injection workflow
- Dynamic content update handling
- Cross-browser compatibility
- Performance impact measurement

### Manual Testing Scenarios
1. **Human Message Detection**
   - Verify no buttons appear on user messages
   - Test with various user message formats
   - Validate button removal from existing human messages

2. **AI Response Processing**
   - Confirm buttons appear on all AI responses
   - Test content extraction excludes UI elements
   - Verify copied text contains only AI response content

3. **Dynamic Content**
   - Test real-time conversation updates
   - Validate button behavior during page navigation
   - Check performance with long conversations

### Test Data Requirements
- Sample Kimi conversation pages with mixed message types
- Examples of AI responses with native copy/share buttons
- Edge cases with unusual message formatting
- Performance test scenarios with large conversation histories