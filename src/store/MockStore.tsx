"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ACCOMMODATIONS } from "@/data/accommodations";
import { buildAnalysis, type ContentAnalysis } from "@/data/analysis";
import {
  CHANNELS,
  CONTENTS,
  PUBLICATIONS,
  TODAY,
  daysBetween,
} from "@/data/contents";
import { FACILITY_DEFS, shotListFor } from "@/data/facilities";
import { buildPhotos } from "@/data/photos";
import type {
  Accommodation,
  Content,
  FacilityDef,
  Photo,
  Publication,
  ShotItem,
  UploadedPhoto,
} from "@/data/types";

/**
 * 목업 전역 상태.
 *
 * 상태관리 라이브러리는 쓰지 않는다. Context + useState 로 충분하다.
 * 목적은 "등록하면 다른 화면에 반영된다"는 흐름을 실제로 동작시키는 것이다.
 * 새로고침하면 초기값으로 돌아간다. 서버가 없으니 당연하고, 목업이므로 그대로 둔다.
 */

interface StoreValue {
  facilities: FacilityDef[];
  accommodations: Accommodation[];
  contents: Content[];
  publications: Publication[];

  /** AX 개선 아이디어 주석 표시 여부 */
  axMode: boolean;
  setAxMode: (next: boolean) => void;

  addFacility: (input: Omit<FacilityDef, "id">) => FacilityDef;
  updateFacility: (id: string, patch: Partial<Omit<FacilityDef, "id">>) => void;
  removeFacility: (id: string) => void;

  saveAccommodation: (acc: Accommodation) => Accommodation;

  addContent: (input: {
    accommodationId: string;
    shootDate: string;
    photographer: string;
  }) => Content;
  updateContent: (id: string, patch: Partial<Omit<Content, "id">>) => void;

  savePublication: (input: Publication) => void;

  /** 화면에서 직접 올린 사진 */
  uploadsOf: (contentId: string) => UploadedPhoto[];
  addUploads: (contentId: string, photos: UploadedPhoto[]) => void;
  setUploadLabel: (contentId: string, photoId: string, label: string) => void;
  clearUploads: (contentId: string) => void;

  accommodationOf: (id: string) => Accommodation | undefined;
  contentOf: (id: string) => Content | undefined;
  contentsOfAccommodation: (accId: string) => Content[];
  shotListOf: (accId: string) => ShotItem[];
  analysisOf: (contentId: string) => ContentAnalysis | null;
  photosOf: (contentId: string) => Photo[];
  publicationsOf: (contentId: string) => Publication[];
  /** 발행 완료된 채널 수 / 전체 채널 수 */
  publishProgress: (contentId: string) => { done: number; total: number };
  usageOf: (facilityId: string) => number;
}

const StoreContext = createContext<StoreValue | null>(null);

function nextId(prefix: string, existing: { id: string }[]) {
  const taken = new Set(existing.map((e) => e.id));
  let n = existing.length + 1;
  let id = `${prefix}-${String(n).padStart(2, "0")}`;
  while (taken.has(id)) {
    n += 1;
    id = `${prefix}-${String(n).padStart(2, "0")}`;
  }
  return id;
}

export function MockStoreProvider({ children }: { children: ReactNode }) {
  const [facilities, setFacilities] = useState<FacilityDef[]>(FACILITY_DEFS);
  const [accommodations, setAccommodations] =
    useState<Accommodation[]>(ACCOMMODATIONS);
  const [contents, setContents] = useState<Content[]>(CONTENTS);
  const [publications, setPublications] = useState<Publication[]>(PUBLICATIONS);
  const [uploads, setUploads] = useState<Record<string, UploadedPhoto[]>>({});
  const [axMode, setAxMode] = useState(true);

  const addFacility = useCallback((input: Omit<FacilityDef, "id">) => {
    const created: FacilityDef = { ...input, id: `f-${Date.now()}` };
    setFacilities((prev) => [...prev, created]);
    return created;
  }, []);

  const updateFacility = useCallback(
    (id: string, patch: Partial<Omit<FacilityDef, "id">>) =>
      setFacilities((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f))),
    [],
  );

  const removeFacility = useCallback((id: string) => {
    setFacilities((prev) => prev.filter((f) => f.id !== id));
    // 지운 시설을 참조하던 숙소에서도 떼어낸다
    setAccommodations((prev) =>
      prev.map((a) => ({
        ...a,
        facilityIds: a.facilityIds.filter((fid) => fid !== id),
      })),
    );
  }, []);

  const saveAccommodation = useCallback(
    (acc: Accommodation) => {
      // 저장 직후 촬영 일정 등록으로 이어져야 해서 확정된 id를 돌려준다
      const isNew = !accommodations.some((a) => a.id === acc.id);
      const saved = isNew ? { ...acc, id: nextId("acc", accommodations) } : acc;
      setAccommodations((prev) =>
        isNew ? [...prev, saved] : prev.map((a) => (a.id === saved.id ? saved : a)),
      );
      return saved;
    },
    [accommodations],
  );

  const addContent = useCallback<StoreValue["addContent"]>(
    (input) => {
      const created: Content = {
        id: nextId("c", contents),
        accommodationId: input.accommodationId,
        shootDate: input.shootDate,
        photographer: input.photographer,
        retoucher: null,
        status: "촬영예정",
        statusChangedAt: TODAY,
        stuckDays: Math.max(0, daysBetween(input.shootDate, TODAY)),
        reshootCount: 0,
      };
      setContents((prev) => [...prev, created]);
      return created;
    },
    [contents],
  );

  const updateContent = useCallback(
    (id: string, patch: Partial<Omit<Content, "id">>) =>
      setContents((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c))),
    [],
  );

  const savePublication = useCallback((input: Publication) => {
    setPublications((prev) => {
      const i = prev.findIndex(
        (p) => p.contentId === input.contentId && p.channelId === input.channelId,
      );
      if (i === -1) return [...prev, input];
      const next = [...prev];
      next[i] = input;
      return next;
    });
  }, []);

  const addUploads = useCallback((contentId: string, photos: UploadedPhoto[]) => {
    setUploads((prev) => ({ ...prev, [contentId]: [...(prev[contentId] ?? []), ...photos] }));
  }, []);

  const setUploadLabel = useCallback(
    (contentId: string, photoId: string, label: string) =>
      setUploads((prev) => ({
        ...prev,
        [contentId]: (prev[contentId] ?? []).map((p) =>
          p.id === photoId ? { ...p, label } : p,
        ),
      })),
    [],
  );

  const clearUploads = useCallback((contentId: string) => {
    setUploads((prev) => {
      (prev[contentId] ?? []).forEach((p) => URL.revokeObjectURL(p.url));
      const next = { ...prev };
      delete next[contentId];
      return next;
    });
  }, []);

  const value = useMemo<StoreValue>(() => {
    const accommodationOf = (id: string) => accommodations.find((a) => a.id === id);
    const contentOf = (id: string) => contents.find((c) => c.id === id);
    const shotListOf = (accId: string) => {
      const acc = accommodationOf(accId);
      return acc ? shotListFor(facilities, acc) : [];
    };
    const analysisOf = (contentId: string) => {
      const content = contentOf(contentId);
      if (!content) return null;
      return buildAnalysis(content, shotListOf(content.accommodationId));
    };
    const publicationsOf = (contentId: string) =>
      publications.filter((p) => p.contentId === contentId);

    return {
      facilities,
      accommodations,
      contents,
      publications,
      axMode,
      setAxMode,
      addFacility,
      updateFacility,
      removeFacility,
      saveAccommodation,
      addContent,
      updateContent,
      savePublication,
      uploadsOf: (contentId) => uploads[contentId] ?? [],
      addUploads,
      setUploadLabel,
      clearUploads,
      accommodationOf,
      contentOf,
      contentsOfAccommodation: (accId) =>
        contents.filter((c) => c.accommodationId === accId),
      shotListOf,
      analysisOf,
      photosOf: (contentId) => {
        const content = contentOf(contentId);
        const analysis = analysisOf(contentId);
        if (!content || !analysis) return [];
        return buildPhotos(content, analysis);
      },
      publicationsOf,
      publishProgress: (contentId) => ({
        done: publicationsOf(contentId).filter((p) => p.status === "발행완료").length,
        total: CHANNELS.length,
      }),
      usageOf: (facilityId) =>
        accommodations.filter((a) => a.facilityIds.includes(facilityId)).length,
    };
  }, [
    facilities,
    accommodations,
    contents,
    publications,
    uploads,
    axMode,
    addFacility,
    updateFacility,
    removeFacility,
    saveAccommodation,
    addContent,
    updateContent,
    savePublication,
    addUploads,
    setUploadLabel,
    clearUploads,
  ]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("MockStoreProvider 안에서만 사용할 수 있습니다");
  return ctx;
}
