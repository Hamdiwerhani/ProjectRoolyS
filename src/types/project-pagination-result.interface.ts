import { Project } from 'src/schemas/project.schema';

export interface ProjectPaginationResult {
    data: Project[];
    total: number;
    page: number;
    limit: number;
    pages: number;
}
