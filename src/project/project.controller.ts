import {
    Controller,
    Post,
    Body,
    Get,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { AuthGuard } from '@nestjs/passport';

// All routes in this controller require a valid JWT token
@UseGuards(AuthGuard('jwt'))
@Controller('projects')
export class ProjectController {
    constructor(private readonly projectService: ProjectService) { }

    // POST /projects
    // Creates a new project for the authenticated user
    @Post()
    createProject(@Request() req, @Body() body) {
        return this.projectService.create({ ...body, owner: req.user.userId });
    }

    // GET /projects?page=1&limit=10&search=query
    // Returns paginated list of projects owned by the authenticated user
    @Get()
    getUserProjects(
        @Request() req,
        @Query('page') page = 1,
        @Query('limit') limit = 10,
        @Query('search') search = '',
    ) {
        return this.projectService.findAll(req.user.userId, +page, +limit, search);
    }

    // POST /projects/share
    // Shares a project with another user and assigns permissions
    @Post('share')
    shareProject(
        @Body() body: { projectId: string; userId: string; permissions: string[] },
    ) {
        return this.projectService.shareProject(
            body.projectId,
            body.userId,
            body.permissions,
        );
    }
}
