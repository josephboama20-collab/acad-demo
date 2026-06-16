import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { loadJSON, saveJSON, uid } from '../utils/storage.js';

const STORAGE_KEY = 'acad_study_groups_v1';
export const SELF_ID = 'self';

const DEFAULT = {
  members: [],
  groups: [],
  activeGroupId: null,
  messages: {},
  dms: {},
  activeDmId: null,
};

const SUGGESTED_MEMBERS = [
  { email: 'alex@acad.demo', name: 'Alex Chen' },
  { email: 'sam@acad.demo', name: 'Sam Osei' },
  { email: 'jordan@acad.demo', name: 'Jordan Lee' },
];

function normalizeGroup(group) {
  if (!group) return group;
  return {
    ...group,
    adminIds: group.adminIds?.length ? group.adminIds : [SELF_ID],
    memberIds: group.memberIds || [],
  };
}

function normalizeState(raw) {
  if (!raw) return { ...DEFAULT };
  const groups = (raw.groups || []).map(normalizeGroup);
  return {
    ...DEFAULT,
    ...raw,
    groups,
    activeGroupId: raw.activeGroupId || groups[0]?.id || null,
  };
}

const StudyGroupsContext = createContext(null);

export function StudyGroupsProvider({ children }) {
  const [state, setState] = useState(() => normalizeState(loadJSON(STORAGE_KEY)));

  const persist = useCallback((updater) => {
    setState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      saveJSON(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const hasPeers = state.members.length > 0;
  const activeGroup = state.groups.find((g) => g.id === state.activeGroupId) || state.groups[0] || null;

  const isGroupAdmin = useCallback(
    (groupId, memberId = SELF_ID) => {
      const group = state.groups.find((g) => g.id === groupId);
      return Boolean(group?.adminIds?.includes(memberId));
    },
    [state.groups],
  );

  const getGroupRoster = useCallback(
    (group) => {
      if (!group) return [];
      const peers = state.members.filter((m) => group.memberIds.includes(m.id));
      return [
        { id: SELF_ID, name: 'You', email: 'your account', isSelf: true },
        ...peers.map((m) => ({ ...m, isSelf: false })),
      ];
    },
    [state.members],
  );

  const addMember = useCallback(
    (email, name, groupId = null) => {
      const trimmed = email.trim().toLowerCase();
      if (!trimmed) return false;
      let added = false;
      persist((s) => {
        const existing = s.members.find((m) => m.email === trimmed);
        const member = existing || {
          id: uid(),
          email: trimmed,
          name: name || trimmed.split('@')[0],
          addedAt: Date.now(),
        };
        const members = existing ? s.members : [...s.members, member];
        let groups = s.groups;
        let activeGroupId = s.activeGroupId;

        const targetId = groupId || s.activeGroupId;
        if (groups.length === 0) {
          const group = normalizeGroup({
            id: uid(),
            name: 'My study group',
            memberIds: [member.id],
            adminIds: [SELF_ID],
            createdAt: Date.now(),
          });
          groups = [group];
          activeGroupId = group.id;
          added = true;
        } else if (targetId) {
          const target = groups.find((g) => g.id === targetId);
          if (!target) return s;
          if (target.memberIds.includes(member.id) && existing) return s;
          groups = groups.map((g) =>
            g.id === targetId ? { ...g, memberIds: [...new Set([...g.memberIds, member.id])] } : g,
          );
          added = true;
        } else {
          groups = groups.map((g, i) =>
            i === 0 ? { ...g, memberIds: [...new Set([...g.memberIds, member.id])] } : g,
          );
          added = true;
        }
        return { ...s, members, groups, activeGroupId };
      });
      return added;
    },
    [persist],
  );

  const createGroup = useCallback(
    (name) => {
      persist((s) => {
        const group = normalizeGroup({
          id: uid(),
          name: name.trim() || 'Study group',
          memberIds: [],
          adminIds: [SELF_ID],
          createdAt: Date.now(),
        });
        return { ...s, groups: [...s.groups, group], activeGroupId: group.id };
      });
    },
    [persist],
  );

  const updateGroupName = useCallback(
    (groupId, name) => {
      if (!name.trim() || !isGroupAdmin(groupId)) return false;
      persist((s) => ({
        ...s,
        groups: s.groups.map((g) => (g.id === groupId ? { ...g, name: name.trim() } : g)),
      }));
      return true;
    },
    [persist, isGroupAdmin],
  );

  const removeMemberFromGroup = useCallback(
    (groupId, memberId) => {
      if (memberId === SELF_ID || !isGroupAdmin(groupId)) return false;
      persist((s) => ({
        ...s,
        groups: s.groups.map((g) =>
          g.id === groupId
            ? {
                ...g,
                memberIds: g.memberIds.filter((id) => id !== memberId),
                adminIds: g.adminIds.filter((id) => id !== memberId),
              }
            : g,
        ),
      }));
      return true;
    },
    [persist, isGroupAdmin],
  );

  const promoteToAdmin = useCallback(
    (groupId, memberId) => {
      if (memberId === SELF_ID || !isGroupAdmin(groupId)) return false;
      persist((s) => ({
        ...s,
        groups: s.groups.map((g) =>
          g.id === groupId && g.memberIds.includes(memberId)
            ? { ...g, adminIds: [...new Set([...g.adminIds, memberId])] }
            : g,
        ),
      }));
      return true;
    },
    [persist, isGroupAdmin],
  );

  const deleteGroup = useCallback(
    (groupId) => {
      if (!isGroupAdmin(groupId)) return false;
      persist((s) => {
        const groups = s.groups.filter((g) => g.id !== groupId);
        if (groups.length === 0) {
          const fallback = normalizeGroup({
            id: uid(),
            name: 'My study group',
            memberIds: s.members.map((m) => m.id),
            adminIds: [SELF_ID],
            createdAt: Date.now(),
          });
          return {
            ...s,
            groups: [fallback],
            activeGroupId: fallback.id,
            messages: { ...s.messages, [groupId]: undefined },
          };
        }
        const activeGroupId = s.activeGroupId === groupId ? groups[0].id : s.activeGroupId;
        return { ...s, groups, activeGroupId };
      });
      return true;
    },
    [persist, isGroupAdmin],
  );

  const removeMemberFromWorkspace = useCallback(
    (memberId) => {
      persist((s) => ({
        ...s,
        members: s.members.filter((m) => m.id !== memberId),
        groups: s.groups.map((g) => ({
          ...g,
          memberIds: g.memberIds.filter((id) => id !== memberId),
          adminIds: g.adminIds.filter((id) => id !== memberId),
        })),
        dms: Object.fromEntries(Object.entries(s.dms).filter(([key]) => key !== memberId)),
        activeDmId: s.activeDmId === memberId ? null : s.activeDmId,
      }));
    },
    [persist],
  );

  const sendGroupMessage = useCallback(
    (groupId, text, sender = 'You') => {
      if (!text.trim()) return;
      persist((s) => {
        const list = s.messages[groupId] || [];
        return {
          ...s,
          messages: {
            ...s.messages,
            [groupId]: [...list, { id: uid(), sender, text: text.trim(), time: new Date().toISOString(), type: 'message' }],
          },
        };
      });
    },
    [persist],
  );

  const sendDm = useCallback(
    (memberId, text, sender = 'You') => {
      if (!text.trim()) return;
      persist((s) => {
        const list = s.dms[memberId] || [];
        return {
          ...s,
          dms: {
            ...s.dms,
            [memberId]: [...list, { id: uid(), sender, text: text.trim(), time: new Date().toISOString() }],
          },
        };
      });
    },
    [persist],
  );

  const shareLink = useCallback(
    (groupId, url) => {
      sendGroupMessage(groupId, `Shared link: ${url}`, 'You');
    },
    [sendGroupMessage],
  );

  const value = useMemo(
    () => ({
      ...state,
      hasPeers,
      activeGroup,
      suggestedMembers: SUGGESTED_MEMBERS,
      addMember,
      createGroup,
      updateGroupName,
      removeMemberFromGroup,
      removeMemberFromWorkspace,
      promoteToAdmin,
      deleteGroup,
      isGroupAdmin,
      getGroupRoster,
      sendGroupMessage,
      sendDm,
      shareLink,
      setActiveGroupId: (id) => persist((s) => ({ ...s, activeGroupId: id })),
      setActiveDmId: (id) => persist((s) => ({ ...s, activeDmId: id })),
    }),
    [
      state,
      hasPeers,
      activeGroup,
      addMember,
      createGroup,
      updateGroupName,
      removeMemberFromGroup,
      removeMemberFromWorkspace,
      promoteToAdmin,
      deleteGroup,
      isGroupAdmin,
      getGroupRoster,
      sendGroupMessage,
      sendDm,
      shareLink,
      persist,
    ],
  );

  return <StudyGroupsContext.Provider value={value}>{children}</StudyGroupsContext.Provider>;
}

export function useStudyGroups() {
  const ctx = useContext(StudyGroupsContext);
  if (!ctx) throw new Error('useStudyGroups must be used within StudyGroupsProvider');
  return ctx;
}
