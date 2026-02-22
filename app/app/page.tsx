"use client"
import { useEffect } from "react"
import api from "@/app/lib/api"
import "@slashid/react/style.css"
import Auth from "@/app/components/Auth"
import {
  Avatar,
  Badge,
  Box,
  Card,
  Container,
  Flex,
  Heading,
  IconButton,
  Inset,
  Separator,
  Spinner,
  Text,
  Theme,
} from "@radix-ui/themes"
import { InfiniteData, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Generation, GenerationsIndexResponse, GenerationsIndexResponseSchema } from "./api/generations/schema"
import { LoggedIn } from "@slashid/react"
import { useInView } from "react-intersection-observer"
import GenerationsForm, { FormData } from "./components/GenerationsForm"
import Masonry from "react-masonry-css"

const PAGE_SIZE = 9
const QKEY_LIST_GENERATIONS = ["ListGenerations"]

const ImageTile: React.FC<{ generation: Generation }> = ({ generation: item }) => {
  if (item.status === "PENDING") {
    return (
      <Card>
        <Flex
          align="center"
          justify="center"
          style={{ aspectRatio: "1 / 1", minHeight: 180 }}
          gap="2"
          direction="column"
        >
          <Spinner size="3" />
          <Text size="1" color="gray">
            Generating…
          </Text>
        </Flex>
      </Card>
    )
  }

  if (item.status === "ERROR") {
    return (
      <Card>
        <Flex
          align="center"
          justify="center"
          style={{ aspectRatio: "1 / 1", minHeight: 180 }}
          direction="column"
          gap="2"
        >
          <Badge color="red" size="2">
            Generation failed
          </Badge>
        </Flex>
      </Card>
    )
  }

  if (item.status === "SUCCESS") {
    return (
      <Card size="1" style={{ overflow: "hidden" }}>
        <Inset>
          <img
            src={item.result}
            alt="Generated image"
            style={{ display: "block", width: "100%", objectFit: "cover" }}
          />
        </Inset>
      </Card>
    )
  }

  return null
}

const prependCreatedItem = <TItem, TMeta>(
  created: TItem[],
  data: InfiniteData<{ meta: TMeta; items: TItem[] }> | undefined
) => {
  if (!data) return undefined
  const [first, ...otherPages] = data.pages
  return {
    pages: [{ meta: first.meta, items: [...created, ...first.items] }, ...otherPages],
    pageParams: data.pageParams,
  }
}

function App() {
  const qClient = useQueryClient()
  const { ref, inView } = useInView()

  const listGenerations = useInfiniteQuery({
    queryKey: QKEY_LIST_GENERATIONS,
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

  useEffect(() => {
    if (inView && listGenerations.hasNextPage && !listGenerations.isFetchingNextPage) {
      listGenerations.fetchNextPage()
    }
  }, [inView, listGenerations.hasNextPage, listGenerations.isFetchingNextPage])

  const CreateGeneration = useMutation({
    mutationKey: ["CreateGeneration"],
    mutationFn: async (data: FormData) => {
      const created = await api.createGeneration(data)
      qClient.setQueryData<InfiniteData<GenerationsIndexResponse>>(QKEY_LIST_GENERATIONS, (data) =>
        prependCreatedItem(created, data)
      )
      return created
    },
  })

  return (
    <Flex direction="column" style={{ minHeight: "100vh" }}>
      {/* Header */}
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
          {/* Sidebar form */}
          <Box
            p="4"
            style={{
              width: 280,
              flexShrink: 0,
              borderRight: "1px solid var(--gray-4)",
              overflowY: "auto",
            }}
          >
            <GenerationsForm mutation={CreateGeneration} />
          </Box>

          {/* Gallery */}
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

            {/* Infinite scroll */}
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

export default App