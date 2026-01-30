---
type: quick
task: 009-react-18-adoption-improvement
status: planned
created: 2025-01-30
estimated_context: 30%
---

<objective>
Improve React 18 adoption score from 35/100 to 70+/100 by systematically applying React 18 performance patterns across the codebase.

Purpose: Enhance rendering performance, reduce unnecessary re-renders, and
improve user experience through modern React patterns.

Output: Memoized components, expanded useTransition/useDeferredValue usage, and
Server Components for static pages. </objective>

<context>
@.planning/PROJECT.md

Current State Analysis:

- Some components already use React.memo (DeviceCard, TransferCard, FriendItem,
  FeatureFilters, FilterChip, TagsDropdown)
- useTransition/useDeferredValue exists in 3 files (feature-search.tsx,
  device-list.tsx)
- Static pages (privacy, terms, security) are already Server Components (no 'use
  client' directive)
- TransferProgress, TransferQueue, TransferQueueProgress lack memoization
- Many dialog components and list items are not memoized </context>

<tasks>

<task type="auto">
  <name>Task 1: Add React.memo to high-frequency render components</name>
  <files>
    components/transfer/transfer-progress.tsx
    components/transfer/transfer-queue.tsx
    components/devices/device-list.tsx
    components/chat/chat-interface.tsx
    components/chat/typing-indicator.tsx
    components/chat/chat-header.tsx
    components/app/MessageBubble.tsx
    components/app/GroupTransferProgress.tsx
    components/app/RecipientSelector.tsx
  </files>
  <action>
    Wrap the following components with React.memo:

    1. TransferProgress - high-frequency progress updates during file transfers
    2. TransferQueueProgress - embedded in TransferProgress file, frequently re-renders
    3. TransferQueue - main export needs memoization (TransferCard child already memoized)
    4. DeviceListItem (if not already in device-list.tsx, extract and memoize list items)
    5. TypingIndicator - animation component that shouldn't re-render on parent updates
    6. ChatHeader - static unless connection state changes
    7. MessageBubble - individual chat messages in list
    8. GroupTransferProgress - similar to TransferProgress, frequent updates
    9. RecipientSelector - list items should be memoized

    Pattern to apply:
    ```tsx
    import { memo } from 'react';

    export const ComponentName = memo(function ComponentName(props: Props) {
      // existing implementation
    });

    ComponentName.displayName = 'ComponentName';
    ```

    For components with object/function props, add custom comparison function if needed:
    ```tsx
    export const ComponentName = memo(function ComponentName(props: Props) {
      // implementation
    }, (prevProps, nextProps) => {
      return prevProps.id === nextProps.id && prevProps.status === nextProps.status;
    });
    ```

  </action>
  <verify>
    - All modified files compile without TypeScript errors: `npx tsc --noEmit`
    - Components render correctly in dev mode: `npm run dev`
    - Check React DevTools Profiler shows reduced re-renders for list items
  </verify>
  <done>
    9+ high-frequency components wrapped with React.memo, displayName set for DevTools debugging
  </done>
</task>

<task type="auto">
  <name>Task 2: Expand useTransition for non-urgent state updates</name>
  <files>
    components/friends/add-friend-dialog.tsx
    components/friends/friend-settings-dialog.tsx
    components/app/CreateRoomDialog.tsx
    components/app/JoinRoomDialog.tsx
    components/transfer/transfer-options-dialog.tsx
    components/security/verification-dialog.tsx
    components/privacy/metadata-strip-dialog.tsx
  </files>
  <action>
    Add useTransition to dialog form submissions and state changes that shouldn't block UI:

    1. AddFriendDialog - wrap friend code submission in startTransition
    2. FriendSettingsDialog - wrap settings save operations
    3. CreateRoomDialog - wrap room creation
    4. JoinRoomDialog - wrap room join operation
    5. TransferOptionsDialog - wrap options save
    6. VerificationDialog - wrap verification initiation
    7. MetadataStripDialog - wrap processing state

    Pattern to apply:
    ```tsx
    import { useTransition } from 'react';

    function DialogComponent() {
      const [isPending, startTransition] = useTransition();

      const handleSubmit = () => {
        startTransition(() => {
          // existing submit logic that updates state
          setResults(processData());
        });
      };

      return (
        <Button disabled={isPending}>
          {isPending ? 'Processing...' : 'Submit'}
        </Button>
      );
    }
    ```

    Use isPending for:
    - Disabling submit buttons during transition
    - Showing loading indicators without blocking input

  </action>
  <verify>
    - Dialogs remain responsive during form submission
    - TypeScript compiles: `npx tsc --noEmit`
    - Test dialog interactions in dev mode
  </verify>
  <done>
    7 dialog components use useTransition for non-blocking state updates, isPending used for loading states
  </done>
</task>

<task type="auto">
  <name>Task 3: Add useDeferredValue to search/filter inputs</name>
  <files>
    components/features/feature-filters.tsx
    components/app/RecipientSelector.tsx
    components/friends/friends-list.tsx
  </files>
  <action>
    Add useDeferredValue to defer expensive filtering operations:

    1. FeatureFilters (TagsDropdown) - defer filteredTags calculation
    2. RecipientSelector - defer device/friend filtering
    3. FriendsList - if search exists, defer filtered results

    Pattern to apply:
    ```tsx
    import { useDeferredValue, useMemo } from 'react';

    function SearchComponent({ items }) {
      const [query, setQuery] = useState('');
      const deferredQuery = useDeferredValue(query);

      const filteredItems = useMemo(() => {
        return items.filter(item =>
          item.name.toLowerCase().includes(deferredQuery.toLowerCase())
        );
      }, [items, deferredQuery]);

      // Use deferredQuery !== query to show stale indicator
      const isStale = query !== deferredQuery;

      return (
        <div style={{ opacity: isStale ? 0.7 : 1 }}>
          <Input value={query} onChange={e => setQuery(e.target.value)} />
          <List items={filteredItems} />
        </div>
      );
    }
    ```

    This keeps input responsive while deferring expensive filtering.

  </action>
  <verify>
    - Search inputs remain responsive during typing
    - Filtered results update after brief delay
    - No TypeScript errors: `npx tsc --noEmit`
  </verify>
  <done>
    Search/filter inputs use useDeferredValue, typing remains responsive even with large lists
  </done>
</task>

<task type="auto">
  <name>Task 4: Memoize additional list items and dialog components</name>
  <files>
    components/transfer/FolderTree.tsx
    components/app/TransferRoom.tsx
    components/app/ScreenSharePreview.tsx
    components/app/ScreenShareViewer.tsx
    components/demos/transfer-speed-demo.tsx
    components/features/feature-card.tsx
    components/features/category-section.tsx
  </files>
  <action>
    Apply React.memo to remaining high-render components:

    1. FolderTree node components - tree nodes re-render on expansion
    2. TransferRoom participant items - list items in room view
    3. ScreenSharePreview - should only re-render on stream changes
    4. ScreenShareViewer - expensive video element, minimize re-renders
    5. TransferSpeedDemo metrics cards - individual metric display
    6. FeatureCard - already may be memoized, verify and add if not
    7. CategorySection - section wrapper for feature lists

    For tree/recursive components:
    ```tsx
    const TreeNode = memo(function TreeNode({ node, depth, onToggle }) {
      return (
        <div style={{ marginLeft: depth * 16 }}>
          <button onClick={() => onToggle(node.id)}>{node.name}</button>
          {node.expanded && node.children?.map(child => (
            <TreeNode key={child.id} node={child} depth={depth + 1} onToggle={onToggle} />
          ))}
        </div>
      );
    });
    ```

  </action>
  <verify>
    - All modified components compile: `npx tsc --noEmit`
    - FolderTree expands/collapses smoothly
    - Screen share components render correctly
  </verify>
  <done>
    7+ additional components memoized, recursive components optimized for tree views
  </done>
</task>

</tasks>

<verification>
After all tasks:
1. Build succeeds: `npm run build`
2. TypeScript clean: `npx tsc --noEmit`
3. Dev server runs: `npm run dev`
4. React DevTools Profiler shows reduced re-renders in:
   - Transfer queue during active transfers
   - Device/friend lists during updates
   - Dialog interactions
   - Search/filter operations
</verification>

<success_criteria>

- 40+ components use React.memo (from ~10 currently)
- useTransition used in 7+ dialog/form components
- useDeferredValue used in 3+ search/filter components
- Static pages remain Server Components (no regression)
- All existing tests pass
- No TypeScript errors
- React 18 adoption score improvement target: 70+/100 </success_criteria>

<output>
After completion, create `.planning/quick/009-react-18-adoption-improvement/009-SUMMARY.md` documenting:
- Components memoized (list with file paths)
- useTransition implementations (list with use cases)
- useDeferredValue implementations (list with use cases)
- Performance improvements observed
- Any issues encountered
</output>
