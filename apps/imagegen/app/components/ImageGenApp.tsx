"use client"

import { useEffect, useRef } from "react"
import api from "@/app/lib/api"
import "@slashid/react/style.css"
import Auth from "@/app/components/Auth"
import {
  Box,
  Flex,
  Heading,
  Spinner,
  Text,
} from "@radix-ui/themes"
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { GenerationsIndexResponseSchema } from "@/app/lib/schema/api"
import { LoggedIn, useSlashID } from "@slashid/react"
import { useInView } from "react-intersection-observer"
import GenerationsForm, { FormData } from "@/app/components/GenerationsForm"
import Masonry from "react-masonry-css"
import { ImageTile } from "./ImageTile"

const PAGE_SIZE = 9
const QUERY_LIST_GENERATIONS = ["ListGenerations"]
const MUTATION_CREATE_GENERATION = ["CreateGeneration"]
const POLL_INTERVAL = 3_000

export default function ImageGenApp() {
  const qClient = useQueryClient()
  const { ref, inView } = useInView()
  const { isAuthenticated } = useSlashID()
  const lastRequestAtRef = useRef(0)

  const listGenerations = useInfiniteQuery({
    enabled: isAuthenticated,
    queryKey: QUERY_LIST_GENERATIONS,
    queryFn: async ({ pageParam }) => {
      const apiResponse = await api.listGenerations({ offset: pageParam, pageSize: PAGE_SIZE })
      return GenerationsIndexResponseSchema.parse(apiResponse)
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const hasMore = lastPage.meta.total > lastPage.meta.offset + lastPage.meta.pageSize
      return hasMore ? lastPage.meta.offset + PAGE_SIZE : null
    },
  })

  const createGeneration = useMutation({
    mutationKey: MUTATION_CREATE_GENERATION,
    mutationFn: async (data: FormData) => {
      await api.createGeneration(data)
      qClient.refetchQueries({queryKey: QUERY_LIST_GENERATIONS})
    },
  })

  useEffect(() => {
    if (listGenerations.dataUpdatedAt > 0) {
      lastRequestAtRef.current = listGenerations.dataUpdatedAt
    }
  }, [listGenerations.dataUpdatedAt])


  // infinite scroll when user reaches bottom of grid
  useEffect(() => {
    if (inView && listGenerations.hasNextPage && !listGenerations.isFetchingNextPage) {
      listGenerations.fetchNextPage()
    }
  }, [inView, listGenerations.hasNextPage, listGenerations.isFetchingNextPage])


  // poll /api/generations/latest and refetch if stale
  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    let isPolling = false
    const intervalId = window.setInterval(async () => {
      if (isPolling) return
      isPolling = true

      try {
        const latestUpdatedAt = await api.getLatestGenerationUpdatedAt()
        if (latestUpdatedAt && latestUpdatedAt.getTime() > lastRequestAtRef.current) {
          await listGenerations.refetch()
        }
      } finally {
        isPolling = false
      }
    }, POLL_INTERVAL)

    return () => window.clearInterval(intervalId)
  }, [isAuthenticated, listGenerations.refetch])

  return (
    <Flex direction="column" style={{ minHeight: "100vh" }}>
      <Box
        px="4"
        py="3"
        style={{
          borderBottom: "1px solid var(--gray-4)",
          background: "var(--color-panel-solid)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <Flex align="center" justify="between">
          <Heading size="4" weight="bold" trim="both">
            ImageGen
          </Heading>
          <Auth />
        </Flex>
      </Box>

      <LoggedIn>
        <Flex overflow="hidden" style={{ height: "calc(100vh - 57px)" }}>
          <Box
            p="4"
            style={{
              width: 280,
              flexShrink: 0,
              borderRight: "1px solid var(--gray-4)",
              overflowY: "auto",
            }}
          >
            <GenerationsForm mutation={createGeneration} />
          </Box>

          <Box p="4" style={{ flex: 1, overflowY: "auto" }}>
            <Masonry
              breakpointCols={{ default: 3, 1024: 2, 640: 1 }}
              className="flex gap-4"
              columnClassName="flex flex-col gap-4"
            >
              {listGenerations.data?.pages.map((page) =>
                page.items.map((item) => <ImageTile key={item.jobId} generation={item} />)
              )}
            </Masonry>

            <Flex ref={ref} justify="center" py="6">
              {!listGenerations.isLoading && (
              listGenerations.isFetchingNextPage ? (
                <Spinner size="2" />
              ) : !listGenerations.hasNextPage ? (
                <Text size="1" color="gray">
                  All Images Loaded
                </Text>
              ) : null)}
            </Flex>
          </Box>
        </Flex>
      </LoggedIn>
    </Flex>
  )
}
