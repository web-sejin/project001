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
import { CONTENTS, TODAY, daysBetween } from "@/data/contents";
import { FACILITY_DEFS, shotListFor } from "@/data/facilities";
import { buildPhotos } from "@/data/photos";
import type {
  Accommodation,
  Content,
  FacilityDef,
  Photo,
  ShotItem,
} from "@/data/types";

/**
 * 목업 전역 상태.
 *
 * 상태관리 라이브러리는 쓰지 않는다. Context + useState 로 충분하다.
 * 목적은 "등록 → 다른 화면에 반영"이라는 흐름을 실제로 동작시키는 것이다.
 * 새로고침하면 초기값으로 돌아간다. 서버가 없으니 당연하고, 목업이므로 그대로 둔다.
 */

interface StoreValue {
  facilities: FacilityDef[];
  accommodations: Accommodation[];
  contents: Content[];

  addFacility: (input: Omit<FacilityDef, "id">) => FacilityDef;
  updateFacility: (id: string, patch: Partial<Omit<FacilityDef, "id">>) => void;
  removeFacility: (id: string) => void;

  saveAccommodation: (acc: Accommodation) => Accommodation;
  removeAccommodation: (id: string) => void;

  addContent: (input: {
    accommodationId: string;
    shootDate: string;
    photographer: string;
  }) => Content;
  updateContent: (id: string, patch: Partial<Omit<Content, "id">>) => void;

  accommodationOf: (id: string) => Accommodation | undefined;
  contentOf: (id: string) => Content | undefined;
  contentsOfAccommodation: (accId: string) => Content[];
  shotListOf: (accId: string) => ShotItem[];
  analysisOf: (contentId: string) => ContentAnalysis | null;
  photosOf: (contentId: string) => Photo[];
  /** 시설 항목을 쓰고 있는 숙소 수 */
  usageOf: (facilityId: string) => number;
}

const StoreContext = createContext<StoreValue | null>(null);

function nextId(prefix: string, existing: { id: string }[]) {
  let n = existing.length + 1;
  const taken = new Set(existing.map((e) => e.id));
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

  const addFacility = useCallback((input: Omit<FacilityDef, "id">) => {
    const created: FacilityDef = { ...input, id: `f-${Date.now()}` };
    setFacilities((prev) => [...prev, created]);
    return created;
  }, []);

  const updateFacility = useCallback(
    (id: string, patch: Partial<Omit<FacilityDef, "id">>) => {
      setFacilities((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...patch } : f)),
      );
    },
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
      // 저장 직후 "촬영 일정 등록"으로 이어져야 해서 확정된 id를 돌려준다
      const isNew = !accommodations.some((a) => a.id === acc.id);
      const saved = isNew ? { ...acc, id: nextId("acc", accommodations) } : acc;
      setAccommodations((prev) =>
        isNew ? [...prev, saved] : prev.map((a) => (a.id === saved.id ? saved : a)),
      );
      return saved;
    },
    [accommodations],
  );

  const removeAccommodation = useCallback((id: string) => {
    setAccommodations((prev) => prev.filter((a) => a.id !== id));
    setContents((prev) => prev.filter((c) => c.accommodationId !== id));
  }, []);

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
        preDepartureCheck: false,
      };
      setContents((prev) => [...prev, created]);
      return created;
    },
    [contents],
  );

  const updateContent = useCallback(
    (id: string, patch: Partial<Omit<Content, "id">>) => {
      setContents((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      );
    },
    [],
  );

  const value = useMemo<StoreValue>(() => {
    const accommodationOf = (id: string) =>
      accommodations.find((a) => a.id === id);
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
    const photosOf = (contentId: string) => {
      const content = contentOf(contentId);
      const analysis = analysisOf(contentId);
      if (!content || !analysis) return [];
      return buildPhotos(content, analysis);
    };

    return {
      facilities,
      accommodations,
      contents,
      addFacility,
      updateFacility,
      removeFacility,
      saveAccommodation,
      removeAccommodation,
      addContent,
      updateContent,
      accommodationOf,
      contentOf,
      contentsOfAccommodation: (accId) =>
        contents.filter((c) => c.accommodationId === accId),
      shotListOf,
      analysisOf,
      photosOf,
      usageOf: (facilityId) =>
        accommodations.filter((a) => a.facilityIds.includes(facilityId)).length,
    };
  }, [
    facilities,
    accommodations,
    contents,
    addFacility,
    updateFacility,
    removeFacility,
    saveAccommodation,
    removeAccommodation,
    addContent,
    updateContent,
  ]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("MockStoreProvider 안에서만 사용할 수 있습니다");
  return ctx;
}
