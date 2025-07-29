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

@UseGuards(AuthGuard('jwt'))
@Controller('projects')
export class ProjectController {
    constructor(private readonly projectService: ProjectService) { }

    @Post()
    createProject(@Request() req, @Body() body) {
        return this.projectService.create({ ...body, owner: req.user.userId });
    }

    @Get()
    getUserProjects(
        @Request() req,
        @Query('page') page = 1,
        @Query('limit') limit = 10,
        @Query('search') search = '',
    ) {
        return this.projectService.findAll(req.user.userId, +page, +limit, search);
    }

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
