"use client";

import { useMemo, useState, useEffect } from "react";

import type {
  TicketType,
  Category,
  SubCategory,
} from "./components/types";

import { uid } from "./components/types";

import { TicketTypeField } from "./components/ticket_type";
import { CategoryField } from "./components/category";
import {
  SubCategoryField,
  EnvironmentField,
} from "./components/sub_category";
import {
  DescriptionCard,
  type SubCategoryDetails,
} from "./components/description";

import { getTicketTypes } from "@/services/integration/insti-admin/get_all_ticket_type";
import { addTicketType } from "@/services/integration/insti-admin/post_ticket_type";
import { editTicketType } from "@/services/integration/insti-admin/patch_ticket_type_id";

import { getCategories } from "@/services/integration/insti-admin/get_all_category";
import { addCategory as addCategoryApi } from "@/services/integration/insti-admin/post_category";
import { editCategory } from "@/services/integration/insti-admin/patch_category_id";

import { getSubCategories } from "@/services/integration/insti-admin/get_all_sub_category";
import { addSubCategory as addSubCategoryApi } from "@/services/integration/insti-admin/post_sub_category";
import { editSubCategory } from "@/services/integration/insti-admin/patch_sub_category_id";

export default function Page() {
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);

  const [loading, setLoading] = useState(true);

  const [categoriesLoading, setCategoriesLoading] =
    useState(false);

  const [selectedTicketTypeId, setSelectedTicketTypeId] =
    useState<string | null>(null);

  const [selectedCategoryId, setSelectedCategoryId] =
    useState<string | null>(null);

  const [selectedSubCategoryId, setSelectedSubCategoryId] =
    useState<string | null>(null);

  /*
   * ============================================================
   * SELECTED TICKET TYPE
   * ============================================================
   */

  const selectedTicketType = useMemo(
    () =>
      ticketTypes.find(
        (ticketType) =>
          ticketType.id === selectedTicketTypeId
      ) ?? null,
    [ticketTypes, selectedTicketTypeId]
  );

  /*
   * ============================================================
   * SELECTED CATEGORY
   * ============================================================
   */

  const selectedCategory = useMemo(
    () =>
      selectedTicketType?.categories.find(
        (category) =>
          category.id === selectedCategoryId
      ) ?? null,
    [selectedTicketType, selectedCategoryId]
  );

  /*
   * ============================================================
   * SELECTED SUB CATEGORY
   * ============================================================
   */

  const selectedSubCategory = useMemo(
    () =>
      selectedCategory?.subCategories.find(
        (subCategory) =>
          subCategory.id === selectedSubCategoryId
      ) ?? null,
    [selectedCategory, selectedSubCategoryId]
  );

  /*
   * ============================================================
   * LOAD TICKET TYPES
   * ============================================================
   *
   * Uses:
   * getTicketTypes()
   */

  useEffect(() => {
    let cancel = false;

    async function loadTicketTypes() {
      setLoading(true);

      try {
        const result = await getTicketTypes();

        if (cancel) {
          return;
        }

        if (!result.response) {
          console.error(
            result.message ||
              "Failed to fetch ticket types"
          );

          setTicketTypes([]);
          setSelectedTicketTypeId(null);
          setSelectedCategoryId(null);
          setSelectedSubCategoryId(null);

          return;
        }

        const mappedTicketTypes: TicketType[] =
          result.response.map(
            (ticketType) => ({
              id: String(
                ticketType.ticket_type_id
              ),

              name: ticketType.ticket_type_name,

              /*
               * TODO:
               * GET_TICKET_TYPE currently does not
               * return a status field, so it
               * defaults to "Active" here.
               */
              status: "Active",

              categories: [],
            })
          );

        setTicketTypes(mappedTicketTypes);

        setSelectedTicketTypeId(
          mappedTicketTypes[0]?.id ?? null
        );

        setSelectedCategoryId(null);
        setSelectedSubCategoryId(null);
      } catch (error) {
        console.error(
          "Failed to load ticket types:",
          error
        );

        if (error instanceof Error) {
          alert(error.message);
        }

        setTicketTypes([]);
        setSelectedTicketTypeId(null);
        setSelectedCategoryId(null);
        setSelectedSubCategoryId(null);
      } finally {
        if (!cancel) {
          setLoading(false);
        }
      }
    }

    loadTicketTypes();

    return () => {
      cancel = true;
    };
  }, []);

  /*
   * ============================================================
   * LOAD CATEGORIES
   * ============================================================
   *
   * Uses:
   * getCategories()
   *
   * Runs whenever the selected ticket type changes.
   * Skips ticket types with a temporary frontend ID,
   * since those don't exist in the backend yet.
   */

  useEffect(() => {
    let cancel = false;

    async function loadCategories() {
      if (!selectedTicketTypeId) {
        return;
      }

      const numericId = Number(
        selectedTicketTypeId
      );

      if (
        !Number.isInteger(numericId) ||
        numericId <= 0
      ) {
        /*
         * Newly-created ticket type with no
         * real database ID yet.
         */
        return;
      }

      setCategoriesLoading(true);

      try {
        const result = await getCategories(
          selectedTicketTypeId
        );

        if (cancel) {
          return;
        }

        if (!result.response) {
          console.error(
            result.message ||
              "Failed to fetch categories"
          );

          return;
        }

        const mappedCategories: Category[] =
          result.response.map(
            (category) => ({
              id: String(
                category.category_id
              ),

              name: category.category_name,

              status: category.status,

              subCategories: [],
            })
          );

        setTicketTypes((prev) =>
          prev.map((ticketType) =>
            ticketType.id ===
            selectedTicketTypeId
              ? {
                  ...ticketType,
                  categories:
                    mappedCategories,
                }
              : ticketType
          )
        );

        setSelectedCategoryId(
          mappedCategories[0]?.id ?? null
        );

        setSelectedSubCategoryId(null);
      } catch (error) {
        console.error(
          "Failed to load categories:",
          error
        );

        if (error instanceof Error) {
          alert(error.message);
        }
      } finally {
        if (!cancel) {
          setCategoriesLoading(false);
        }
      }
    }

    loadCategories();

    return () => {
      cancel = true;
    };
  }, [selectedTicketTypeId]);

  /*
   * ============================================================
   * LOAD SUB CATEGORIES
   * ============================================================
   *
   * Uses:
   * getSubCategories()
   *
   * Runs whenever the selected category changes.
   * Skips categories with a temporary frontend ID,
   * since those don't exist in the backend yet.
   *
   * NOTE:
   * SubCategoryResp includes subject_name, has_duration,
   * duration_days, and status, none of which currently
   * exist on the local SubCategory type (id, name,
   * description, environment). has_duration is mapped to
   * environment as a best-effort match — confirm this is
   * the right pairing, and let me know if SubCategory
   * should be extended to carry subject_name/duration_days/
   * status so they round-trip correctly on edit.
   */

  useEffect(() => {
    let cancel = false;

    async function loadSubCategories() {
      if (!selectedCategoryId) {
        return;
      }

      const numericId = Number(
        selectedCategoryId
      );

      if (
        !Number.isInteger(numericId) ||
        numericId <= 0
      ) {
        /*
         * Newly-created category with no
         * real database ID yet.
         */
        return;
      }

      try {
        const result =
          await getSubCategories(
            selectedCategoryId
          );

        if (cancel) {
          return;
        }

        if (!result.response) {
          console.error(
            result.message ||
              "Failed to fetch sub categories"
          );

          return;
        }

        const mappedSubCategories: SubCategory[] =
          result.response.map(
            (subCategory) => ({
              id: String(
                subCategory.sub_category_id
              ),

              name: subCategory.sub_category_name,

              description:
                subCategory.description,

              environment:
                subCategory.has_duration,

              subjectName:
                subCategory.subject_name,

              durationDays:
                subCategory.duration_days,

              status: subCategory.status,
            })
          );

        setTicketTypes((prev) =>
          prev.map((ticketType) =>
            ticketType.id ===
            selectedTicketTypeId
              ? {
                  ...ticketType,

                  categories:
                    ticketType.categories.map(
                      (category) =>
                        category.id ===
                        selectedCategoryId
                          ? {
                              ...category,
                              subCategories:
                                mappedSubCategories,
                            }
                          : category
                    ),
                }
              : ticketType
          )
        );

        setSelectedSubCategoryId(
          mappedSubCategories[0]?.id ??
            null
        );
      } catch (error) {
        console.error(
          "Failed to load sub categories:",
          error
        );

        if (error instanceof Error) {
          alert(error.message);
        }
      }
    }

    loadSubCategories();

    return () => {
      cancel = true;
    };
  }, [selectedCategoryId]);

  /*
   * ============================================================
   * SELECT TICKET TYPE
   * ============================================================
   */

  function handleSelectTicketType(
    id: string
  ) {
    setSelectedTicketTypeId(id);

    setSelectedCategoryId(null);

    setSelectedSubCategoryId(null);
  }

  /*
   * ============================================================
   * SELECT CATEGORY
   * ============================================================
   */

  function handleSelectCategory(
    id: string
  ) {
    setSelectedCategoryId(id);

    const category =
      selectedTicketType?.categories.find(
        (category) =>
          category.id === id
      );

    setSelectedSubCategoryId(
      category?.subCategories[0]?.id ??
        null
    );
  }

  /*
   * ============================================================
   * SELECT SUB CATEGORY
   * ============================================================
   */

  function handleSelectSubCategory(
    id: string
  ) {
    setSelectedSubCategoryId(id);
  }

  /*
   * ============================================================
   * ADD TICKET TYPE
   * ============================================================
   *
   * Uses:
   * POST_TICKET_TYPE
   */

  async function addTicketTypeHandler(
    name: string
  ) {
    const trimmed = name.trim();

    if (!trimmed) {
      return;
    }

    try {
      const result = await addTicketType({
        ticket_type_name: trimmed,
      });

      /*
       * If the API provides a ret_code,
       * treat non-200/201 as an error.
       */
      if (
        result.ret_code &&
        result.ret_code !== "200" &&
        result.ret_code !== "201"
      ) {
        throw new Error(
          result.message ||
            "Failed to add ticket type"
        );
      }

      /*
       * Your current POST response does not
       * return the new ticket_type_id.
       *
       * Therefore a temporary frontend ID
       * is used here.
       */
      const newTicketType: TicketType = {
        id: uid(),
        name: trimmed,
        status: "Active",
        categories: [],
      };

      setTicketTypes((prev) => [
        ...prev,
        newTicketType,
      ]);

      setSelectedTicketTypeId(
        newTicketType.id
      );

      setSelectedCategoryId(null);

      setSelectedSubCategoryId(null);
    } catch (error) {
      console.error(
        "Failed to add ticket type:",
        error
      );

      if (error instanceof Error) {
        alert(error.message);
      }
    }
  }

  /*
   * ============================================================
   * RENAME TICKET TYPE
   * ============================================================
   *
   * Uses:
   * PATCH_TICKET_TYPE
   */

  async function renameTicketType(
    id: string,
    name: string
  ) {
    const trimmed = name.trim();

    if (!trimmed) {
      return;
    }

    const ticketType =
      ticketTypes.find(
        (ticket) => ticket.id === id
      );

    if (!ticketType) {
      return;
    }

    /*
     * Prevent calling PATCH with a temporary
     * frontend ID generated by uid().
     *
     * Real API IDs are numeric strings.
     */
    const numericId = Number(id);

    if (
      !Number.isInteger(numericId) ||
      numericId <= 0
    ) {
      /*
       * This is a newly-created item whose
       * real database ID is currently unknown.
       */
      setTicketTypes((prev) =>
        prev.map((ticket) =>
          ticket.id === id
            ? {
                ...ticket,
                name: trimmed,
              }
            : ticket
        )
      );

      return;
    }

    try {
      const result =
        await editTicketType(id, {
          ticket_type_name: trimmed,
          status:
            ticketType.status ||
            "Active",
        });

      if (
        result.ret_code &&
        result.ret_code !== "200" &&
        result.ret_code !== "201"
      ) {
        throw new Error(
          result.message ||
            "Failed to update ticket type"
        );
      }

      setTicketTypes((prev) =>
        prev.map((ticket) =>
          ticket.id === id
            ? {
                ...ticket,
                name: trimmed,
              }
            : ticket
        )
      );
    } catch (error) {
      console.error(
        "Failed to rename ticket type:",
        error
      );

      if (error instanceof Error) {
        alert(error.message);
      }
    }
  }

  /*
   * ============================================================
   * DELETE TICKET TYPE
   * ============================================================
   *
   * No DELETE API connected yet.
   *
   * This currently only removes it from local state.
   */

  function deleteTicketType(
    id: string
  ) {
    setTicketTypes((prev) => {
      const next = prev.filter(
        (ticketType) =>
          ticketType.id !== id
      );

      if (
        selectedTicketTypeId === id
      ) {
        const nextTicketType =
          next[0] ?? null;

        setSelectedTicketTypeId(
          nextTicketType?.id ?? null
        );

        const nextCategory =
          nextTicketType
            ?.categories[0] ?? null;

        setSelectedCategoryId(
          nextCategory?.id ?? null
        );

        setSelectedSubCategoryId(
          nextCategory
            ?.subCategories[0]?.id ??
            null
        );
      }

      return next;
    });
  }

  /*
   * ============================================================
   * ADD CATEGORY
   * ============================================================
   *
   * Uses:
   * POST_CATEGORY
   */

  async function addCategory(
    name: string
  ) {
    const trimmed = name.trim();

    if (
      !trimmed ||
      !selectedTicketTypeId
    ) {
      return;
    }

    const numericTicketTypeId = Number(
      selectedTicketTypeId
    );

    if (
      !Number.isInteger(
        numericTicketTypeId
      ) ||
      numericTicketTypeId <= 0
    ) {
      /*
       * Ticket type hasn't been persisted
       * to the backend yet, so there's no
       * real ticket_type_id to attach this
       * category to.
       */
      alert(
        "Please wait for the ticket type to finish saving before adding a category."
      );

      return;
    }

    try {
      const result = await addCategoryApi({
        ticket_type_id:
          numericTicketTypeId,
        category_name: trimmed,
      });

      if (
        result.ret_code &&
        result.ret_code !== "200" &&
        result.ret_code !== "201"
      ) {
        throw new Error(
          result.message ||
            "Failed to add category"
        );
      }

      /*
       * Your current POST response does not
       * return the new category_id.
       *
       * Therefore a temporary frontend ID
       * is used here.
       */
      const newCategory: Category = {
        id: uid(),
        name: trimmed,
        status: "Active",
        subCategories: [],
      };

      setTicketTypes((prev) =>
        prev.map((ticketType) =>
          ticketType.id ===
          selectedTicketTypeId
            ? {
                ...ticketType,

                categories: [
                  ...ticketType.categories,
                  newCategory,
                ],
              }
            : ticketType
        )
      );

      setSelectedCategoryId(
        newCategory.id
      );

      setSelectedSubCategoryId(null);
    } catch (error) {
      console.error(
        "Failed to add category:",
        error
      );

      if (error instanceof Error) {
        alert(error.message);
      }
    }
  }

  /*
   * ============================================================
   * RENAME CATEGORY
   * ============================================================
   *
   * Uses:
   * PATCH_CATEGORY
   */

  async function renameCategory(
    id: string,
    name: string
  ) {
    const trimmed = name.trim();

    if (
      !trimmed ||
      !selectedTicketTypeId
    ) {
      return;
    }

    const category =
      selectedTicketType?.categories.find(
        (category) => category.id === id
      );

    if (!category) {
      return;
    }

    /*
     * Prevent calling PATCH with a temporary
     * frontend ID generated by uid().
     *
     * Real API IDs are numeric strings.
     */
    const numericId = Number(id);

    if (
      !Number.isInteger(numericId) ||
      numericId <= 0
    ) {
      /*
       * This is a newly-created category whose
       * real database ID is currently unknown.
       */
      setTicketTypes((prev) =>
        prev.map((ticketType) =>
          ticketType.id ===
          selectedTicketTypeId
            ? {
                ...ticketType,

                categories:
                  ticketType.categories.map(
                    (category) =>
                      category.id === id
                        ? {
                            ...category,
                            name: trimmed,
                          }
                        : category
                  ),
              }
            : ticketType
        )
      );

      return;
    }

    try {
      const result = await editCategory(
        id,
        {
          category_name: trimmed,
          status:
            category.status || "Active",
        }
      );

      if (
        result.ret_code &&
        result.ret_code !== "200" &&
        result.ret_code !== "201"
      ) {
        throw new Error(
          result.message ||
            "Failed to update category"
        );
      }

      setTicketTypes((prev) =>
        prev.map((ticketType) =>
          ticketType.id ===
          selectedTicketTypeId
            ? {
                ...ticketType,

                categories:
                  ticketType.categories.map(
                    (category) =>
                      category.id === id
                        ? {
                            ...category,
                            name: trimmed,
                          }
                        : category
                  ),
              }
            : ticketType
        )
      );
    } catch (error) {
      console.error(
        "Failed to rename category:",
        error
      );

      if (error instanceof Error) {
        alert(error.message);
      }
    }
  }

  /*
   * ============================================================
   * DELETE CATEGORY
   * ============================================================
   *
   * Local only for now.
   */

  function deleteCategory(
    id: string
  ) {
    if (!selectedTicketTypeId) {
      return;
    }

    setTicketTypes((prev) =>
      prev.map((ticketType) => {
        if (
          ticketType.id !==
          selectedTicketTypeId
        ) {
          return ticketType;
        }

        const nextCategories =
          ticketType.categories.filter(
            (category) =>
              category.id !== id
          );

        if (
          selectedCategoryId === id
        ) {
          const nextCategory =
            nextCategories[0] ?? null;

          setSelectedCategoryId(
            nextCategory?.id ?? null
          );

          setSelectedSubCategoryId(
            nextCategory
              ?.subCategories[0]?.id ??
              null
          );
        }

        return {
          ...ticketType,
          categories:
            nextCategories,
        };
      })
    );
  }

  /*
   * ============================================================
   * ADD SUB CATEGORY
   * ============================================================
   *
   * Uses:
   * POST_SUB_CATEGORY
   *
   * NOTE:
   * subject_name, has_duration, and duration_days are
   * sent with placeholder defaults below since the local
   * "add sub category" form only collects a name. Update
   * these once the form captures the real values.
   */

  async function addSubCategory(
    name: string
  ) {
    const trimmed = name.trim();

    if (
      !trimmed ||
      !selectedTicketTypeId ||
      !selectedCategoryId
    ) {
      return;
    }

    const numericCategoryId = Number(
      selectedCategoryId
    );

    if (
      !Number.isInteger(
        numericCategoryId
      ) ||
      numericCategoryId <= 0
    ) {
      /*
       * Category hasn't been persisted
       * to the backend yet, so there's no
       * real category_id to attach this
       * sub category to.
       */
      alert(
        "Please wait for the category to finish saving before adding a sub category."
      );

      return;
    }

    try {
      const result =
        await addSubCategoryApi({
          category_id:
            numericCategoryId,
          subject_name: "",
          sub_category_name: trimmed,
          description: "",
          has_duration: false,
          duration_days: 0,
        });

      if (
        result.ret_code &&
        result.ret_code !== "200" &&
        result.ret_code !== "201"
      ) {
        throw new Error(
          result.message ||
            "Failed to add sub category"
        );
      }

      /*
       * Your current POST response does not
       * return the new sub_category_id.
       *
       * Therefore a temporary frontend ID
       * is used here.
       */
      const newSubCategory: SubCategory = {
        id: uid(),
        name: trimmed,
        description: "",
        environment: false,
        subjectName: "",
        durationDays: 0,
        status: "Active",
      };

      setTicketTypes((prev) =>
        prev.map((ticketType) =>
          ticketType.id ===
          selectedTicketTypeId
            ? {
                ...ticketType,

                categories:
                  ticketType.categories.map(
                    (category) =>
                      category.id ===
                      selectedCategoryId
                        ? {
                            ...category,

                            subCategories: [
                              ...category.subCategories,
                              newSubCategory,
                            ],
                          }
                        : category
                  ),
              }
            : ticketType
        )
      );

      setSelectedSubCategoryId(
        newSubCategory.id
      );
    } catch (error) {
      console.error(
        "Failed to add sub category:",
        error
      );

      if (error instanceof Error) {
        alert(error.message);
      }
    }
  }

  /*
   * ============================================================
   * RENAME SUB CATEGORY
   * ============================================================
   *
   * Uses:
   * PATCH_SUB_CATEGORY
   *
   * NOTE:
   * subject_name and duration_days aren't tracked on the
   * local SubCategory type, so they're re-sent as blank/0
   * here rather than their real saved values. Extend
   * SubCategory to carry them if the API should preserve
   * whatever was previously set.
   */

  async function renameSubCategory(
    id: string,
    name: string
  ) {
    const trimmed = name.trim();

    if (
      !trimmed ||
      !selectedTicketTypeId ||
      !selectedCategoryId
    ) {
      return;
    }

    const subCategory =
      selectedCategory?.subCategories.find(
        (subCategory) =>
          subCategory.id === id
      );

    if (!subCategory) {
      return;
    }

    /*
     * Prevent calling PATCH with a temporary
     * frontend ID generated by uid().
     *
     * Real API IDs are numeric strings.
     */
    const numericId = Number(id);

    if (
      !Number.isInteger(numericId) ||
      numericId <= 0
    ) {
      /*
       * This is a newly-created sub category
       * whose real database ID is currently
       * unknown.
       */
      setTicketTypes((prev) =>
        prev.map((ticketType) =>
          ticketType.id ===
          selectedTicketTypeId
            ? {
                ...ticketType,

                categories:
                  ticketType.categories.map(
                    (category) =>
                      category.id ===
                      selectedCategoryId
                        ? {
                            ...category,

                            subCategories:
                              category.subCategories.map(
                                (subCategory) =>
                                  subCategory.id ===
                                  id
                                    ? {
                                        ...subCategory,
                                        name: trimmed,
                                      }
                                    : subCategory
                              ),
                          }
                        : category
                  ),
              }
            : ticketType
        )
      );

      return;
    }

    try {
      const result =
        await editSubCategory(id, {
          sub_category_name: trimmed,
          subject_name:
            subCategory.subjectName || "",
          description:
            subCategory.description ||
            "",
          has_duration:
            subCategory.environment,
          duration_days:
            subCategory.durationDays || 0,
          status:
            subCategory.status || "Active",
        });

      if (
        result.ret_code &&
        result.ret_code !== "200" &&
        result.ret_code !== "201"
      ) {
        throw new Error(
          result.message ||
            "Failed to update sub category"
        );
      }

      setTicketTypes((prev) =>
        prev.map((ticketType) =>
          ticketType.id ===
          selectedTicketTypeId
            ? {
                ...ticketType,

                categories:
                  ticketType.categories.map(
                    (category) =>
                      category.id ===
                      selectedCategoryId
                        ? {
                            ...category,

                            subCategories:
                              category.subCategories.map(
                                (subCategory) =>
                                  subCategory.id ===
                                  id
                                    ? {
                                        ...subCategory,
                                        name: trimmed,
                                      }
                                    : subCategory
                              ),
                          }
                        : category
                  ),
              }
            : ticketType
        )
      );
    } catch (error) {
      console.error(
        "Failed to rename sub category:",
        error
      );

      if (error instanceof Error) {
        alert(error.message);
      }
    }
  }

  /*
   * ============================================================
   * DELETE SUB CATEGORY
   * ============================================================
   *
   * Local only for now.
   */

  function deleteSubCategory(
    id: string
  ) {
    if (
      !selectedTicketTypeId ||
      !selectedCategoryId
    ) {
      return;
    }

    setTicketTypes((prev) =>
      prev.map((ticketType) => {
        if (
          ticketType.id !==
          selectedTicketTypeId
        ) {
          return ticketType;
        }

        return {
          ...ticketType,

          categories:
            ticketType.categories.map(
              (category) => {
                if (
                  category.id !==
                  selectedCategoryId
                ) {
                  return category;
                }

                const nextSubCategories =
                  category.subCategories.filter(
                    (subCategory) =>
                      subCategory.id !==
                      id
                  );

                if (
                  selectedSubCategoryId ===
                  id
                ) {
                  setSelectedSubCategoryId(
                    nextSubCategories[0]
                      ?.id ?? null
                  );
                }

                return {
                  ...category,

                  subCategories:
                    nextSubCategories,
                };
              }
            ),
        };
      })
    );
  }

  /*
   * ============================================================
   * SAVE SUB CATEGORY DETAILS
   * ============================================================
   *
   * Uses:
   * PATCH_SUB_CATEGORY
   *
   * Saves the full template form from DescriptionCard:
   * subject name, description, has-duration + days, and
   * status, all keyed to the selected sub category.
   */

  async function saveSubCategoryDetails(
    details: SubCategoryDetails
  ) {
    if (
      !selectedTicketTypeId ||
      !selectedCategoryId ||
      !selectedSubCategoryId
    ) {
      return;
    }

    const subCategory =
      selectedSubCategory;

    if (!subCategory) {
      return;
    }

    const numericId = Number(
      selectedSubCategoryId
    );

    const applyLocal = () => {
      setTicketTypes((prev) =>
        prev.map((ticketType) =>
          ticketType.id ===
          selectedTicketTypeId
            ? {
                ...ticketType,

                categories:
                  ticketType.categories.map(
                    (category) =>
                      category.id ===
                      selectedCategoryId
                        ? {
                            ...category,

                            subCategories:
                              category.subCategories.map(
                                (subCategory) =>
                                  subCategory.id ===
                                  selectedSubCategoryId
                                    ? {
                                        ...subCategory,
                                        subjectName:
                                          details.subjectName,
                                        description:
                                          details.description,
                                        environment:
                                          details.environment,
                                        durationDays:
                                          details.durationDays,
                                        status:
                                          details.status,
                                      }
                                    : subCategory
                              ),
                          }
                        : category
                  ),
              }
            : ticketType
        )
      );
    };

    if (
      !Number.isInteger(numericId) ||
      numericId <= 0
    ) {
      /*
       * This is a newly-created sub category
       * whose real database ID is currently
       * unknown.
       */
      applyLocal();

      return;
    }

    try {
      const result =
        await editSubCategory(
          selectedSubCategoryId,
          {
            sub_category_name:
              subCategory.name,
            subject_name:
              details.subjectName,
            description:
              details.description,
            has_duration:
              details.environment,
            duration_days:
              details.durationDays,
            status: details.status,
          }
        );

      if (
        result.ret_code &&
        result.ret_code !== "200" &&
        result.ret_code !== "201"
      ) {
        throw new Error(
          result.message ||
            "Failed to update sub category"
        );
      }

      applyLocal();
    } catch (error) {
      console.error(
        "Failed to save sub category details:",
        error
      );

      if (error instanceof Error) {
        alert(error.message);
      }
    }
  }

  /*
   * ============================================================
   * TOGGLE ENVIRONMENT
   * ============================================================
   *
   * Uses:
   * PATCH_SUB_CATEGORY
   *
   * NOTE:
   * Mapped to the has_duration field on the API — confirm
   * that's the correct pairing for this toggle.
   */

  async function toggleEnvironment(
    enabled: boolean
  ) {
    if (
      !selectedTicketTypeId ||
      !selectedCategoryId ||
      !selectedSubCategoryId
    ) {
      return;
    }

    const subCategory =
      selectedSubCategory;

    if (!subCategory) {
      return;
    }

    const numericId = Number(
      selectedSubCategoryId
    );

    const applyLocal = () => {
      setTicketTypes((prev) =>
        prev.map((ticketType) =>
          ticketType.id ===
          selectedTicketTypeId
            ? {
                ...ticketType,

                categories:
                  ticketType.categories.map(
                    (category) =>
                      category.id ===
                      selectedCategoryId
                        ? {
                            ...category,

                            subCategories:
                              category.subCategories.map(
                                (subCategory) =>
                                  subCategory.id ===
                                  selectedSubCategoryId
                                    ? {
                                        ...subCategory,
                                        environment:
                                          enabled,
                                      }
                                    : subCategory
                              ),
                          }
                        : category
                  ),
              }
            : ticketType
        )
      );
    };

    if (
      !Number.isInteger(numericId) ||
      numericId <= 0
    ) {
      /*
       * This is a newly-created sub category
       * whose real database ID is currently
       * unknown.
       */
      applyLocal();

      return;
    }

    try {
      const result =
        await editSubCategory(
          selectedSubCategoryId,
          {
            sub_category_name:
              subCategory.name,
            subject_name:
              subCategory.subjectName || "",
            description:
              subCategory.description ||
              "",
            has_duration: enabled,
            duration_days:
              subCategory.durationDays || 0,
            status:
              subCategory.status || "Active",
          }
        );

      if (
        result.ret_code &&
        result.ret_code !== "200" &&
        result.ret_code !== "201"
      ) {
        throw new Error(
          result.message ||
            "Failed to update sub category"
        );
      }

      applyLocal();
    } catch (error) {
      console.error(
        "Failed to toggle environment:",
        error
      );

      if (error instanceof Error) {
        alert(error.message);
      }
    }
  }

  /*
   * ============================================================
   * PAGE
   * ============================================================
   */

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800">
            Template Details
          </h2>

          <div className="mt-6 space-y-5">
            <TicketTypeField
              ticketTypes={ticketTypes}
              loading={loading}
              selectedTicketType={
                selectedTicketType
              }
              onSelect={
                handleSelectTicketType
              }
              onAdd={
                addTicketTypeHandler
              }
              onRename={
                renameTicketType
              }
              onDelete={
                deleteTicketType
              }
            />

            <CategoryField
              selectedTicketType={
                selectedTicketType
              }
              selectedCategory={
                selectedCategory
              }
              loading={
                categoriesLoading
              }
              onSelect={
                handleSelectCategory
              }
              onAdd={addCategory}
              onRename={
                renameCategory
              }
              onDelete={
                deleteCategory
              }
            />

            <SubCategoryField
              selectedCategory={
                selectedCategory
              }
              selectedSubCategory={
                selectedSubCategory
              }
              onSelect={
                handleSelectSubCategory
              }
              onAdd={
                addSubCategory
              }
              onRename={
                renameSubCategory
              }
              onDelete={
                deleteSubCategory
              }
            />

            <EnvironmentField
              selectedSubCategory={
                selectedSubCategory
              }
              onToggle={
                toggleEnvironment
              }
            />
          </div>
        </div>

        <DescriptionCard
          key={
            selectedSubCategory?.id ??
            "none"
          }
          subCategory={
            selectedSubCategory
          }
          onSave={
            saveSubCategoryDetails
          }
        />
      </div>
    </div>
  );
}