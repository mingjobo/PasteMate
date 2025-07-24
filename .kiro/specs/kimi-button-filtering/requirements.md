# Requirements Document

## Introduction

This feature addresses two specific issues with the PureText One-Click extension on the Kimi website (www.kimi.com):

1. Copy buttons are incorrectly appearing next to human messages (user input)
2. When copying AI responses, the copied text includes unwanted UI elements like existing "复制" (copy) and "分享" (share) button text from Kimi's native interface

The goal is to implement intelligent filtering to ensure copy buttons only appear on AI responses and the copied content excludes Kimi's native UI button text.

## Requirements

### Requirement 1

**User Story:** As a user of the Kimi website, I want copy buttons to only appear on AI responses, so that I don't accidentally copy my own messages or see unnecessary buttons.

#### Acceptance Criteria

1. WHEN the extension scans the Kimi website THEN it SHALL distinguish between human messages and AI responses
2. WHEN a human message is detected THEN the system SHALL NOT inject a copy button
3. WHEN an AI response is detected THEN the system SHALL inject a copy button
4. IF a copy button already exists on a human message THEN the system SHALL remove it

### Requirement 2

**User Story:** As a user copying AI responses on Kimi, I want the copied text to contain only the actual AI response content, so that I don't get unwanted UI button text mixed in with the response.

#### Acceptance Criteria

1. WHEN copying an AI response THEN the system SHALL exclude Kimi's native "复制" (copy) button text from the copied content
2. WHEN copying an AI response THEN the system SHALL exclude Kimi's native "分享" (share) button text from the copied content
3. WHEN copying an AI response THEN the system SHALL exclude any other Kimi UI element text that is not part of the actual response
4. WHEN extracting plain text THEN the system SHALL preserve only the AI's actual response content

### Requirement 3

**User Story:** As a developer maintaining the extension, I want robust element detection logic for Kimi, so that the system works reliably across different page layouts and updates.

#### Acceptance Criteria

1. WHEN detecting message types THEN the system SHALL use multiple identification methods (CSS classes, attributes, content analysis)
2. WHEN the Kimi page structure changes THEN the system SHALL adapt using fallback detection methods
3. IF primary selectors fail THEN the system SHALL use intelligent content analysis to identify message types
4. WHEN new messages are added dynamically THEN the system SHALL correctly classify and process them

### Requirement 4

**User Story:** As a user, I want the extension to work seamlessly with Kimi's existing UI elements, so that there are no visual conflicts or functionality issues.

#### Acceptance Criteria

1. WHEN injecting copy buttons THEN the system SHALL avoid conflicts with existing copy/share buttons
2. WHEN positioning buttons THEN the system SHALL respect Kimi's layout and styling
3. IF existing buttons are present THEN the system SHALL position new buttons appropriately
4. WHEN buttons are clicked THEN they SHALL not interfere with Kimi's native functionality