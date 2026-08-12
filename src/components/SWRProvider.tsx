"use client";

import React from "react";
import { SWRConfig } from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false, // ป้องกันการ re-fetch ถ้ารูปแบบหน้าจอโฟกัสกลับมา
        dedupingInterval: 10000,   // รวมและกรอง request ซ้ำในเวลา 10 วินาที
        keepPreviousData: true,   // แสดงข้อมูลเก่าใน Cache ค้างไว้ทันทีแบบ 0ms ในระหว่างรอโหลดใหม่
      }}
    >
      {children}
    </SWRConfig>
  );
}
